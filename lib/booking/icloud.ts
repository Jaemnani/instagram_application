// ⚠️ 서버 전용 — 애플 앱 암호를 다룬다. 클라이언트 컴포넌트('use client')에서 import 하지 말 것.
import { randomUUID } from "node:crypto";

import { createDAVClient, type DAVCalendar } from "tsdav";

import { siteConfig } from "@/lib/config";

import type { SourceResult } from "./sources";
import { busyFromIcs } from "./sources";
import type { Interval } from "./time";

/**
 * 애플(iCloud) 캘린더 — 예약 신청을 저장하고, 그 캘린더의 일정으로 시간을 막는다.
 *
 * 사장님은 아이폰 캘린더로 예약을 관리한다. 홈페이지 신청은 "HJ 홈페이지 kidding [대기] …" 일정으로 들어가고,
 * 승인은 제목의 [대기]를 지우는 것, 거절은 일정을 지우는 것이다. 대기 일정도 시간을 막아
 * 같은 시간에 신청이 두 번 들어오지 않는다.
 *
 * ⚠️ 이 캘린더는 반드시 "공유하지 않는" 캘린더여야 한다. 손님 이름·연락처가 들어가므로
 *    공개 캘린더 링크로 읽으면 링크를 아는 누구나 볼 수 있다. 그래서 공개 링크가 아니라
 *    애플 계정 + 앱 암호로 로그인해서(CalDAV) 읽고 쓴다.
 */

const SERVER_URL = "https://caldav.icloud.com";
/** 캘린더 찾기(로그인·목록 조회)는 느리므로 잠깐 기억해 둔다 */
const CALENDAR_TTL_MS = 10 * 60 * 1000;
/** 일정 목록은 짧게만 기억한다 — 사장님이 아이폰에서 지운 일정이 빨리 풀려야 한다 */
const BUSY_TTL_MS = 30 * 1000;

export const BOOKING_CALENDAR_LABEL = "apple";

type AppleConfig = { username: string; password: string; calendarName: string };

export function appleConfig(): AppleConfig | null {
  const username = process.env.APPLE_CALDAV_USER?.trim();
  const password = process.env.APPLE_CALDAV_PASSWORD?.trim();
  const calendarName = process.env.APPLE_BOOKING_CALENDAR?.trim();
  return username && password && calendarName ? { username, password, calendarName } : null;
}

/**
 * 홈페이지에서 직접 신청을 받을지.
 * 2026-10-19 결정: 손님은 네이버에서 예약한다 → 신청서는 BOOKING_REQUESTS_ENABLED=true 로
 * 명시적으로 켤 때만 연다. (애플 계정은 빈 시간 계산용으로 Vercel 에 이미 들어가 있어,
 * 계정 존재만으로 켜지면 개인정보처리방침 개정 없이 이름·연락처를 받게 된다.)
 */
export function bookingRequestsEnabled(): boolean {
  return process.env.BOOKING_REQUESTS_ENABLED?.trim() === "true" && appleConfig() !== null;
}

/**
 * 손님이 이 화면의 빈 시간을 보고 **네이버에서 곧바로 예약**하는 모드인가.
 * 신청서가 꺼졌다고 다 이 모드가 아니다 — 네이버 주소가 없으면 카카오 문의로 끝나고 사람이 확정한다
 * (Codex P2). 이 모드에서만 "캘린더 하나라도 못 읽으면 닫기"가 필요하다.
 */
export function directBookingMode(): boolean {
  return !bookingRequestsEnabled() && Boolean(siteConfig.naverBookingUrl);
}

type Connection = {
  client: Awaited<ReturnType<typeof createDAVClient>>;
  calendar: DAVCalendar;
  at: number;
};

let connection: Promise<Connection> | null = null;
let connectionAt = 0;

function displayName(c: DAVCalendar): string {
  return typeof c.displayName === "string" ? c.displayName.trim() : "";
}

async function connect(cfg: AppleConfig): Promise<Connection> {
  const client = await createDAVClient({
    serverUrl: SERVER_URL,
    credentials: { username: cfg.username, password: cfg.password },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  const calendars = await client.fetchCalendars();
  const calendar = calendars.find((c) => displayName(c) === cfg.calendarName);
  if (!calendar) {
    // 이름만 남긴다 — 다른 캘린더의 내용은 로그에 남기지 않는다
    const names = calendars.map(displayName).filter(Boolean).join(", ");
    throw new Error(`애플 캘린더 "${cfg.calendarName}" 을 찾지 못함 (있는 캘린더: ${names || "없음"})`);
  }
  return { client, calendar, at: Date.now() };
}

async function getConnection(cfg: AppleConfig): Promise<Connection> {
  if (!connection || Date.now() - connectionAt > CALENDAR_TTL_MS) {
    connectionAt = Date.now();
    connection = connect(cfg).catch((err) => {
      connection = null; // 실패는 기억하지 않는다 — 다음 요청에서 다시 시도
      throw err;
    });
  }
  return connection;
}

let busyCache: { at: number; range: Interval; busy: Interval[] } | null = null;

/** 신청을 저장한 직후 호출 — 방금 막힌 시간이 다음 조회에 바로 반영되게 */
export function forgetBusyCache(): void {
  busyCache = null;
}

/** 예약 캘린더의 일정 → 바쁜 구간. 다른 캘린더(아워플레이스 등)와 같은 형식으로 돌려준다. */
export async function readAppleBusy(range: Interval, opts: { fresh?: boolean } = {}): Promise<SourceResult> {
  const cfg = appleConfig();
  // 설정이 없으면 "일정 없음"이 아니라 "읽지 못함"이다. SIDO 는 모든 예약이 모이는 중심 캘린더라
  // 빈 성공으로 넘기면 마감 피드가 비어 아워플레이스가 시간을 다시 열고, 네이버 직접 예약도 겹친다(Codex P1).
  if (!cfg) return { label: BOOKING_CALENDAR_LABEL, ok: false, error: "애플 캘린더 설정 없음 (APPLE_CALDAV_*)" };

  const hit = busyCache;
  if (!opts.fresh && hit && Date.now() - hit.at < BUSY_TTL_MS && hit.range.start <= range.start && hit.range.end >= range.end) {
    return { label: BOOKING_CALENDAR_LABEL, ok: true, busy: hit.busy.filter((b) => b.end > range.start && b.start < range.end) };
  }

  try {
    const { client, calendar } = await getConnection(cfg);
    // 반복 일정까지 잡으려고 범위를 하루씩 넓혀 받고, 실제 판정은 busyFromIcs 가 한다
    const wide = { start: range.start - 86_400_000, end: range.end + 86_400_000 };
    const objects = await client.fetchCalendarObjects({
      calendar,
      timeRange: { start: new Date(wide.start).toISOString(), end: new Date(wide.end).toISOString() },
    });
    const busy = objects.flatMap((o) => (typeof o.data === "string" ? busyFromIcs(o.data, range) : []));
    busyCache = { at: Date.now(), range, busy };
    return { label: BOOKING_CALENDAR_LABEL, ok: true, busy };
  } catch (err) {
    connection = null;
    console.error("[booking] 애플 캘린더 읽기 실패", (err as Error).message);
    return { label: BOOKING_CALENDAR_LABEL, ok: false, error: (err as Error).message };
  }
}

/** 같은 시작 시각에 이미 신청 일정이 있다 — 손님에게 "방금 마감"으로 안내한다 */
export class SlotTakenError extends Error {}

/**
 * 신청 일정을 예약 캘린더에 만든다. 실패하면 던진다 — 호출부가 손님에게 실패를 알린다.
 *
 * 파일 이름을 **시작 시각**으로 고정한다(`slot-<epoch>.ics`). tsdav 는 만들 때 `If-None-Match: *` 를
 * 보내므로, 같은 시작 시각의 신청이 동시에 두 건 와도 애플 서버가 두 번째를 412 로 거절한다 —
 * "빈 시간 확인 → 저장" 사이의 경쟁을 서버 인스턴스와 무관하게 막는 원자적 예약이다(Codex P2).
 * 시작 시각은 다르지만 겹치는 동시 신청(10:00 vs 10:30)은 여기서 못 막는다 — 확률이 낮고,
 * 둘 다 "[대기]"로 들어가 사장님 승인 단계에서 걸러진다.
 */
/**
 * 같은 이름의 파일이 이미 있을 때, 그게 **지금도 이 시간을 차지하는지** 판단한다.
 * 직원이 아이폰에서 일정을 다른 시간으로 옮기면 파일 이름(원래 시각)은 그대로 남는다 —
 * 그 남은 파일을 "마감"으로 보면 원래 시각은 화면엔 비었는데 신청은 영원히 거절된다(Codex P2).
 * 내용을 못 읽으면(null) 안전하게 "차지함"으로 본다.
 */
export function lockStillHolds(existingIcs: string | null, interval: Interval): boolean {
  if (existingIcs === null) return true;
  return busyFromIcs(existingIcs, interval).some((b) => b.start < interval.end && b.end > interval.start);
}

export async function createAppleEvent(filename: string, ics: string, interval: Interval): Promise<void> {
  const cfg = appleConfig();
  if (!cfg) throw new Error("애플 캘린더가 설정되지 않음");
  const { client, calendar } = await getConnection(cfg);
  let res = await client.createCalendarObject({ calendar, iCalString: ics, filename });
  if (res.status === 412) {
    // 같은 이름이 있다 — 그 일정이 아직 이 시간에 있으면 마감, 옮겨진 뒤 남은 파일이면 다른 이름으로 저장
    const url = new URL(filename, calendar.url).href;
    const existing = await client
      .fetchCalendarObjects({ calendar, objectUrls: [url] })
      .then((objs) => (typeof objs[0]?.data === "string" ? objs[0].data : null))
      .catch(() => null);
    if (lockStillHolds(existing, interval)) throw new SlotTakenError("같은 시작 시각의 일정이 이미 있음");
    // 옮겨진 일정의 남은 이름 — 고유한 이름으로 한 번만 다시 시도한다. 이 드문 경우에만 원자성이 빠진다.
    res = await client.createCalendarObject({
      calendar,
      iCalString: ics,
      filename: filename.replace(/\.ics$/, `-${randomUUID().slice(0, 8)}.ics`),
    });
  }
  if (!res.ok) {
    connection = null;
    throw new Error(`애플 캘린더 저장 실패 HTTP ${res.status}`);
  }
  forgetBusyCache();
}
