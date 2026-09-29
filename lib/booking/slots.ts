/**
 * 빈 시간 계산 — 외부 입력(네트워크·env)이 없는 순수 함수만 둔다.
 * 그래서 규칙이 바뀌어도 이 파일만 시험하면 된다.
 */

import type { WeeklyHours } from "./config";
import { addDays, type Interval, kstMidnight, kstWeekday, MINUTE_MS, minutesToHhmm } from "./time";

export type SlotRules = {
  stepMinutes: number;
  bufferMinutes: number;
  minLeadHours: number;
  maxDaysAhead: number;
};

export type DayAvailability = {
  date: string;
  /** 시작 가능한 시각 "HH:MM" (KST) */
  starts: string[];
};

/**
 * 후보 [start, start+duration) 가 바쁜 구간과 텀 안쪽으로 겹치는가.
 *
 * 텀은 양쪽에 건다: 기존 일정 [s, e) 가 있으면 [s - 텀, e + 텀) 안에는 촬영을 못 둔다.
 * 우리 예약끼리만이 아니라 다른 플랫폼 일정에도 똑같이 적용해야 하므로,
 * "예약 뒤에만 텀"이 아니라 바쁜 구간 쪽을 부풀려 비교한다.
 */
export function conflicts(candidate: Interval, busy: Interval[], bufferMinutes: number): boolean {
  const pad = bufferMinutes * MINUTE_MS;
  return busy.some((b) => candidate.start < b.end + pad && candidate.end > b.start - pad);
}

/** 하루치 시작 가능 시각 */
export function daySlots(opts: {
  date: string;
  durationMinutes: number;
  hours: WeeklyHours;
  busy: Interval[];
  rules: SlotRules;
  now: number;
}): string[] {
  const { date, durationMinutes, hours, busy, rules, now } = opts;
  const day = hours[kstWeekday(date)];
  if (!day) return [];

  const midnight = kstMidnight(date);
  const earliest = now + rules.minLeadHours * 60 * MINUTE_MS;
  const out: string[] = [];

  // 촬영이 영업 종료 전에 끝나야 한다. 마지막 예약 뒤 텀은 영업시간 밖이어도 된다.
  for (let m = day.open; m + durationMinutes <= day.close; m += rules.stepMinutes) {
    const start = midnight + m * MINUTE_MS;
    if (start < earliest) continue;
    const candidate = { start, end: start + durationMinutes * MINUTE_MS };
    if (!conflicts(candidate, busy, rules.bufferMinutes)) out.push(minutesToHhmm(m));
  }
  return out;
}

/** 여러 날 — 예약 창(오늘 ~ maxDaysAhead) 밖의 날은 빈 목록으로 돌려준다 */
export function rangeSlots(opts: {
  from: string;
  days: number;
  durationMinutes: number;
  hours: WeeklyHours;
  busy: Interval[];
  rules: SlotRules;
  now: number;
  today: string;
}): DayAvailability[] {
  const lastOpen = addDays(opts.today, opts.rules.maxDaysAhead);
  const out: DayAvailability[] = [];
  for (let i = 0; i < opts.days; i++) {
    const date = addDays(opts.from, i);
    const inWindow = date >= opts.today && date <= lastOpen;
    out.push({ date, starts: inWindow ? daySlots({ ...opts, date }) : [] });
  }
  return out;
}
