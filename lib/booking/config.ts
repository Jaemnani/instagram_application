/**
 * 예약 규칙 — 상품, 시간 단위, 텀, 영업시간, 외부 캘린더 목록.
 *
 * 확정된 운영 규칙(2026-09-30 사장님 확인):
 * - 시작 시각은 30분 단위로 자유 선택
 * - 촬영 길이는 상품이 정한다 (1시간 / 2시간)
 * - 예약과 예약 사이에는 30분 텀. 다른 플랫폼에서 들어온 일정에도 똑같이 적용한다.
 */

import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";

import { hhmmToMinutes } from "./time";

function envInt(key: string, fallback: number): number {
  const n = Number(process.env[key]?.trim());
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export type Product = {
  id: string;
  /** 촬영 길이(분) */
  minutes: number;
  name: Record<Locale, string>;
};

/**
 * 예약 가능한 상품. 상품명·구성은 사장님께 받은 목록으로 교체한다.
 * ⚠️ 가격은 미확인이라 넣지 않는다(ko.ts 머리 주석과 같은 원칙).
 */
export const PRODUCTS: Product[] = [
  {
    id: "1h",
    minutes: 60,
    name: { ko: "1시간 촬영", en: "1-hour session", ja: "1時間撮影", zh: "1小时拍摄" },
  },
  {
    id: "2h",
    minutes: 120,
    name: { ko: "2시간 촬영", en: "2-hour session", ja: "2時間撮影", zh: "2小时拍摄" },
  },
];

export function findProduct(id: string | null | undefined): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export const bookingRules = {
  /** 시작 시각 선택 단위(분) */
  stepMinutes: 30,
  /** 예약 사이 비워둘 텀(분) — 앞뒤 모두 적용 */
  bufferMinutes: envInt("BOOKING_BUFFER_MINUTES", 30),
  /** 지금부터 최소 몇 시간 뒤부터 신청 가능한가 (승인 시간 확보) */
  minLeadHours: envInt("BOOKING_MIN_LEAD_HOURS", 24),
  /** 며칠 뒤까지 열어둘까 */
  maxDaysAhead: envInt("BOOKING_MAX_DAYS", 60),
};

/** 요일(0=일 … 6=토)별 영업시간(자정부터 분). 쉬는 날은 없음. */
export type WeeklyHours = Partial<Record<number, { open: number; close: number }>>;

// "Mo".."Su" → Date.getUTCDay() 번호
const DAY_INDEX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * "Mo-Fr 10:00-19:00, Sa-Su 10:00-18:00" (schema.org openingHours 와 같은 형식) 을 해석한다.
 * JSON-LD 가 쓰는 BIZ_HOURS 를 그대로 재사용해 영업시간의 출처를 하나로 유지한다.
 * 형식이 틀리면 null — 호출부는 예약을 열지 않는다(잘못된 시간에 예약을 받는 것보다 낫다).
 */
export function parseWeeklyHours(spec: string): WeeklyHours | null {
  const out: WeeklyHours = {};
  const parts = spec.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  for (const raw of parts) {
    const m = /^([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(raw);
    if (!m) return null;
    const [, from, to, opensRaw, closesRaw] = m;
    const start = DAY_ORDER.indexOf(from);
    const end = to ? DAY_ORDER.indexOf(to) : start;
    const open = hhmmToMinutes(opensRaw);
    const close = hhmmToMinutes(closesRaw);
    if (start < 0 || end < start || open === null || close === null || close <= open) return null;
    for (const d of DAY_ORDER.slice(start, end + 1)) out[DAY_INDEX[d]] = { open, close };
  }
  return out;
}

/** 예약용 영업시간. BOOKING_HOURS 로 따로 줄 수 있고, 없으면 사이트 영업시간을 쓴다. */
export function bookingHours(): WeeklyHours | null {
  const spec = process.env.BOOKING_HOURS?.trim() || siteConfig.business.openingHours;
  return spec ? parseWeeklyHours(spec) : null;
}

export type CalendarSource = {
  /** 관리자 화면·로그에 쓰는 이름 (예: 아워플레이스) */
  label: string;
  url: string;
};

/**
 * 바쁜 시간을 읽어올 외부 캘린더(iCal 주소) 목록.
 *
 * 형식: 한 줄(또는 쉼표)에 하나씩 `이름=주소`
 *   BOOKING_ICS_SOURCES="아워플레이스=https://...ics, 구글=https://calendar.google.com/.../basic.ics"
 *
 * 구글은 API 대신 "비공개 iCal 주소"를 우선 쓴다 — 서버가 직접 가져오면 즉시 최신이다.
 * (구글 캘린더 앱의 'URL로 구독'이 12~24시간 늦는 것과는 다른 경로다.)
 * 주소에는 비밀 토큰이 들어 있으므로 env 로만 주입하고 화면·응답에 노출하지 않는다.
 */
export function calendarSources(): CalendarSource[] {
  const raw = process.env.BOOKING_ICS_SOURCES?.trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const eq = entry.indexOf("=");
      // 주소의 쿼리스트링에도 = 가 있으므로 첫 번째 = 만 구분자로 본다
      const label = eq > 0 ? entry.slice(0, eq).trim() : "";
      const url = (eq > 0 ? entry.slice(eq + 1) : entry).trim().replace(/^webcal:\/\//i, "https://");
      if (!/^https?:\/\//i.test(url)) {
        console.warn(`[booking] BOOKING_ICS_SOURCES 항목을 건너뜀 (주소 형식 아님): ${label || "(이름 없음)"}`);
        return [];
      }
      return [{ label: label || new URL(url).hostname, url }];
    });
}
