/**
 * 예약 시각 계산 — 모든 판단은 한국 시간(KST, UTC+9) 기준이다.
 *
 * 한국은 서머타임이 없어 오프셋이 +9 로 고정이므로, 무거운 타임존 라이브러리 없이
 * epoch ms 와 "YYYY-MM-DD" 날짜 문자열 사이를 산술로 오간다.
 * 서버(Vercel)는 UTC 로 돌기 때문에 Date 의 로컬 getter 를 쓰면 안 된다.
 */

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const MINUTE_MS = 60 * 1000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

/** 반열린 구간 [start, end) — epoch ms */
export type Interval = { start: number; end: number };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateString(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [, y, mo, d] = m.map(Number);
  const t = Date.UTC(y, mo - 1, d);
  // 2월 30일 같은 값은 Date.UTC 가 다음 달로 넘겨버리므로 되돌려 비교한다
  return new Date(t).getUTCDate() === d && new Date(t).getUTCMonth() === mo - 1;
}

/** KST 날짜 "YYYY-MM-DD" 의 0시(KST)를 epoch ms 로 */
export function kstMidnight(date: string): number {
  const m = DATE_RE.exec(date);
  if (!m) throw new Error(`잘못된 날짜 형식: ${date}`);
  const [, y, mo, d] = m.map(Number);
  return Date.UTC(y, mo - 1, d) - KST_OFFSET_MS;
}

/** epoch ms → KST 날짜 "YYYY-MM-DD" */
export function kstDateOf(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** KST 날짜의 요일 (0=일 … 6=토) */
export function kstWeekday(date: string): number {
  return new Date(kstMidnight(date) + KST_OFFSET_MS).getUTCDay();
}

/** 날짜 문자열에 n일을 더한다 */
export function addDays(date: string, n: number): string {
  return kstDateOf(kstMidnight(date) + n * DAY_MS);
}

/** 자정부터 분 → "HH:MM" */
export function minutesToHhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "HH:MM" → 자정부터 분. 형식이 틀리면 null */
export function hhmmToMinutes(s: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 24 || mm > 59 || (h === 24 && mm > 0)) return null;
  return h * 60 + mm;
}
