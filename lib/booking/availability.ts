/**
 * 통합 빈 시간 — 모든 외부 캘린더의 바쁜 시간을 합쳐 상품별 시작 가능 시각을 낸다.
 * 예약 페이지 API 와 (다음 단계의) 신청 확정 직전 재확인이 같은 함수를 쓴다.
 */

import { bookingHours, bookingRules, calendarSources, invalidCalendarSources, type Product } from "./config";
import { type DayAvailability, rangeSlots } from "./slots";
import { readAppleBusy } from "./icloud";
import { readSource, type SourceResult } from "./sources";
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
  // 예약 창(오늘 ~ maxDaysAhead) 밖은 캘린더를 읽지 않는다 — 공개 API 에 9999년 같은 날짜를 넣으면
  // 반복 일정을 수천 년치 펼치고 CalDAV 에 거대한 조회를 보내게 된다(Codex P1). 창 밖 날짜는 어차피 빈 결과.
  const readRange = clampToBookingWindow(range, kstDateOf(now), bookingRules.maxDaysAhead);
  const results = readRange
    ? [
        ...(await Promise.all([
          ...calendarSources().map((s) => readSource(s, readRange, { fresh: opts.fresh })),
          readAppleBusy(readRange, { fresh: opts.fresh }),
        ])),
        ...invalidAsFailed(),
      ]
    : [];
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
  const results = [
    ...(await Promise.all([
      ...sources.map((s) => readSource(s, range, { fresh: opts.fresh })),
      readAppleBusy(range, { fresh: opts.fresh }),
    ])),
    ...invalidAsFailed(),
  ];
  return {
    busy: results.flatMap((r) => (r.ok ? r.busy : [])),
    failed: results.filter((r) => !r.ok).map((r) => r.label),
  };
}

/** 조회 구간을 예약 창(어제 ~ 오늘+maxDaysAhead+1일)으로 자른다. 겹치지 않으면 null — 읽을 것이 없다. */
export function clampToBookingWindow(range: Interval, today: string, maxDaysAhead: number): Interval | null {
  const start = Math.max(range.start, kstMidnight(addDays(today, -1)));
  const end = Math.min(range.end, kstMidnight(addDays(today, maxDaysAhead + 1)));
  return end > start ? { start, end } : null;
}

/** 형식이 틀린 캘린더 항목을 "읽기 실패"로 — 조용히 빠지면 그 채널 예약이 없는 빈 시간이 나간다 */
function invalidAsFailed(): SourceResult[] {
  return invalidCalendarSources().map((label) => ({ label, ok: false, error: "주소 형식 아님" }));
}
