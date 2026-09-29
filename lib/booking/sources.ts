/**
 * 외부 캘린더(iCal)에서 "바쁜 시간"만 뽑아온다.
 *
 * 일정 제목·설명은 버리고 구간만 남긴다 — 다른 플랫폼 손님의 이름이 들어 있을 수 있어
 * 우리 서버가 들고 있을 이유가 없다.
 */

import ical, { type VEvent } from "node-ical";

import type { CalendarSource } from "./config";
import { addDays, DAY_MS, type Interval, kstDateOf, kstMidnight } from "./time";

const FETCH_TIMEOUT_MS = 8000;
/** 같은 서버 인스턴스 안에서 짧게 재사용 — 예약 페이지에서 달을 넘길 때마다 다시 받지 않도록 */
const CACHE_TTL_MS = 60 * 1000;

export type SourceResult =
  | { label: string; ok: true; busy: Interval[] }
  | { label: string; ok: false; error: string };

const cache = new Map<string, { at: number; busy: Interval[] }>();

/**
 * 종일 일정의 날짜. node-ical 은 DATE 값을 서버 로컬 시간의 0시로 만든다
 * (`new Date(y, m, d)`) — 그래서 여기서만은 로컬 getter 가 맞다.
 * UTC getter 를 쓰면 서버 타임존에 따라 하루가 밀린다.
 */
function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** iCal 본문 → 바쁜 구간. range 와 겹치는 일정만 남긴다. */
export function busyFromIcs(body: string, range: Interval): Interval[] {
  const parsed = ical.sync.parseICS(body);
  const out: Interval[] = [];
  const from = new Date(range.start - DAY_MS);
  const to = new Date(range.end + DAY_MS);

  for (const item of Object.values(parsed)) {
    if (!item || item.type !== "VEVENT") continue;
    const event = item as VEvent;
    // 취소된 일정, '한가함'으로 표시된 일정은 시간을 막지 않는다
    if (event.status === "CANCELLED") continue;
    if (event.transparency === "TRANSPARENT") continue;

    const instances = ical.expandRecurringEvent(event, { from, to, expandOngoing: true });
    for (const inst of instances) {
      if (inst.event.status === "CANCELLED") continue;
      let start: number;
      let end: number;
      if (inst.isFullDay) {
        // 종일 일정은 한국 날짜 기준 그날 전체를 막는다. DTEND 는 다음 날(배타적)이다.
        const startDate = localDateString(inst.start);
        const endDate = inst.end ? localDateString(inst.end) : addDays(startDate, 1);
        start = kstMidnight(startDate);
        end = kstMidnight(endDate > startDate ? endDate : addDays(startDate, 1));
      } else {
        start = inst.start.getTime();
        end = inst.end ? inst.end.getTime() : start;
      }
      if (!(end > start)) continue; // 길이 0 인 일정은 막을 시간이 없다
      if (end <= range.start || start >= range.end) continue;
      out.push({ start, end });
    }
  }
  return out;
}

async function fetchIcs(url: string): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: "text/calendar, text/plain;q=0.9, */*;q=0.1" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.text();
  // 로그인 페이지 등 HTML 이 오면 파싱이 조용히 빈 결과를 내므로 여기서 실패로 잡는다
  if (!body.includes("BEGIN:VCALENDAR")) throw new Error("iCal 형식이 아님");
  return body;
}

/**
 * 한 캘린더를 읽는다. 실패해도 예외를 던지지 않고 ok:false 로 돌려준다 —
 * 캘린더 하나가 죽었다고 예약 페이지 전체가 죽으면 안 되기 때문이다.
 * 대신 호출부가 "일부 캘린더를 확인하지 못함"을 손님과 관리자에게 드러낸다.
 */
export async function readSource(
  source: CalendarSource,
  range: Interval,
  opts: { fresh?: boolean } = {},
): Promise<SourceResult> {
  const hit = cache.get(source.url);
  if (!opts.fresh && hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { label: source.label, ok: true, busy: hit.busy.filter((b) => b.end > range.start && b.start < range.end) };
  }
  try {
    const body = await fetchIcs(source.url);
    // 캐시는 넉넉한 창으로 만들어 달 이동 시에도 재사용되게 한다
    const wide = { start: Math.min(range.start, Date.now() - DAY_MS), end: Math.max(range.end, Date.now() + 120 * DAY_MS) };
    const busy = busyFromIcs(body, wide);
    cache.set(source.url, { at: Date.now(), busy });
    return { label: source.label, ok: true, busy: busy.filter((b) => b.end > range.start && b.start < range.end) };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    // 주소에는 비밀 토큰이 있으므로 로그에는 이름만 남긴다
    console.warn(`[booking] ${source.label} 캘린더를 읽지 못함: ${error}`);
    return { label: source.label, ok: false, error };
  }
}

/** 디버깅용: 구간을 KST 로 읽기 쉽게 */
export function describe(i: Interval): string {
  return `${kstDateOf(i.start)} ${new Date(i.start + 9 * 3600e3).toISOString().slice(11, 16)}~${new Date(i.end + 9 * 3600e3).toISOString().slice(11, 16)}`;
}
