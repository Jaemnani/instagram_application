/**
 * 통합 빈 시간 — 모든 외부 캘린더의 바쁜 시간을 합쳐 상품별 시작 가능 시각을 낸다.
 * 예약 페이지 API 와 (다음 단계의) 신청 확정 직전 재확인이 같은 함수를 쓴다.
 */

import { bookingHours, bookingRules, calendarSources, type Product } from "./config";
import { type DayAvailability, rangeSlots } from "./slots";
import { readAppleBusy } from "./icloud";
import { readSource } from "./sources";
import { addDays, type Interval, kstDateOf, kstMidnight } from "./time";

export type AvailabilityResult =
  | {
      ok: true;
      days: DayAvailability[];
      /** 읽지 못한 캘린더가 있으면 true — 그 캘린더의 일정은 반영되지 않았다 */
      degraded: boolean;
    }
  | { ok: false; reason: "no-hours" };

export async function getAvailability(opts: {
  product: Product;
  from: string;
  days: number;
  now?: number;
  fresh?: boolean;
}): Promise<AvailabilityResult> {
  const hours = bookingHours();
  if (!hours) return { ok: false, reason: "no-hours" };

  const now = opts.now ?? Date.now();
  const range: Interval = { start: kstMidnight(opts.from), end: kstMidnight(addDays(opts.from, opts.days)) };

  // 외부 플랫폼(iCal 주소) + 애플 예약 캘린더(홈페이지 신청·사장님 수동 일정)를 함께 읽는다
  const results = await Promise.all([
    ...calendarSources().map((s) => readSource(s, range, { fresh: opts.fresh })),
    readAppleBusy(range, { fresh: opts.fresh }),
  ]);
  const busy = results.flatMap((r) => (r.ok ? r.busy : []));

  const days = rangeSlots({
    from: opts.from,
    days: opts.days,
    durationMinutes: opts.product.minutes,
    hours,
    busy,
    rules: bookingRules,
    now,
    today: kstDateOf(now),
  });

  return { ok: true, days, degraded: results.some((r) => !r.ok) };
}

/**
 * 모든 캘린더의 바쁜 구간을 모은다 (막힌 시간 피드용).
 * excludeHost 의 캘린더는 뺀다 — 피드를 가져가는 플랫폼 자신의 일정을 되돌려주면,
 * 그 플랫폼이 가져온 일정을 다시 내보낼 때 취소된 예약이 영원히 막히는 순환이 생길 수 있다.
 */
export async function collectBusy(
  range: Interval,
  opts: { excludeHost?: string; fresh?: boolean } = {},
): Promise<{ busy: Interval[]; failed: string[] }> {
  const hostOf = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  };
  const sources = calendarSources().filter((s) => !opts.excludeHost || hostOf(s.url) !== opts.excludeHost);
  const results = await Promise.all([
    ...sources.map((s) => readSource(s, range, { fresh: opts.fresh })),
    readAppleBusy(range, { fresh: opts.fresh }),
  ]);
  return {
    busy: results.flatMap((r) => (r.ok ? r.busy : [])),
    failed: results.filter((r) => !r.ok).map((r) => r.label),
  };
}
