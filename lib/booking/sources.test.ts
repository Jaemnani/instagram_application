/**
 * 외부 캘린더(iCal) → 바쁜 구간 변환 테스트.
 * 픽스처는 실제 피드 형식을 그대로 옮긴 것이다(2026-10-11 실측, 개인정보·토큰 제외).
 *
 *   npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseWeeklyHours } from "./config";
import { rangeSlots } from "./slots";
import { busyFromIcs } from "./sources";
import { kstMidnight } from "./time";

const OCT_RANGE = { start: kstMidnight("2026-10-01"), end: kstMidnight("2026-11-01") };

function calendar(...events: string[]): string {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "X-WR-TIMEZONE:Asia/Seoul", ...events, "END:VCALENDAR"].join("\r\n");
}

/**
 * 스페이스클라우드 피드는 캘린더 머리에 VTIMEZONE(Asia/Seoul)을 싣고, 일정 시각은
 * 시간대 표기 없이(floating) 보낸다. node-ical 은 이 VTIMEZONE 으로 floating 시각을 해석한다.
 * ⚠️ VTIMEZONE 이 없는 피드라면 floating 시각을 "서버 시간대"로 읽어 Vercel(UTC)에서 9시간
 *    밀린다(실측). 새 플랫폼을 붙일 때는 피드 머리에 VTIMEZONE 이 있는지 먼저 볼 것.
 */
function spacecloudCalendar(...events: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:icalendar-ruby",
    "BEGIN:VTIMEZONE",
    "TZID:Asia/Seoul",
    "BEGIN:STANDARD",
    "DTSTART:19881009T020000",
    "TZOFFSETFROM:+1000",
    "TZOFFSETTO:+0900",
    "TZNAME:KST",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** 아워플레이스 형식 — 모든 일정에 TRANSP:TRANSPARENT 가 붙고, 시각엔 TZID 가 있다 */
const hourplace = (start: string, end: string) =>
  [
    "BEGIN:VEVENT",
    "UID:hourplace-test",
    `DTSTART;TZID=Asia/Seoul:${start}`,
    `DTEND;TZID=Asia/Seoul:${end}`,
    "SUMMARY:성수동 50평대 자연광 호리존스튜디오",
    "TRANSP:TRANSPARENT",
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].join("\r\n");

/** 스페이스클라우드 형식 — 시간대 표기 없는(floating) 자정~자정 */
const spacecloudAllDay = [
  "BEGIN:VEVENT",
  "UID:spacecloud-test",
  "DTSTART:20261020T000000",
  "DTEND:20261021T000000",
  "SUMMARY:test",
  "END:VEVENT",
].join("\r\n");

test("아워플레이스: '한가함' 표시가 붙어 있어도 시간을 막는다", () => {
  const busy = busyFromIcs(calendar(hourplace("20261020T100000", "20261020T220000")), OCT_RANGE);
  assert.deepEqual(busy, [
    { start: kstMidnight("2026-10-20") + 10 * 3600_000, end: kstMidnight("2026-10-20") + 22 * 3600_000 },
  ]);
});

test("아워플레이스: 종일(자정~자정)도 막는다", () => {
  const busy = busyFromIcs(calendar(hourplace("20261020T000000", "20261021T000000")), OCT_RANGE);
  assert.deepEqual(busy, [{ start: kstMidnight("2026-10-20"), end: kstMidnight("2026-10-21") }]);
});

test("취소된 일정은 막지 않는다", () => {
  const cancelled = hourplace("20261020T100000", "20261020T220000").replace("STATUS:CONFIRMED", "STATUS:CANCELLED");
  const busy = busyFromIcs(calendar(cancelled), OCT_RANGE);
  assert.deepEqual(busy, []);
});

test("스페이스클라우드: 시간대 표기가 없는 종일 일정도 한국 날짜 하루를 막는다", () => {
  const busy = busyFromIcs(spacecloudCalendar(spacecloudAllDay), OCT_RANGE);
  assert.deepEqual(busy, [{ start: kstMidnight("2026-10-20"), end: kstMidnight("2026-10-21") }]);
});

test("예약 화면: 아워플레이스 종일 일정이 있는 날은 시작 가능한 시간이 없다", () => {
  const busy = busyFromIcs(calendar(hourplace("20261020T000000", "20261021T000000")), OCT_RANGE);
  const days = rangeSlots({
    from: "2026-10-19",
    days: 3,
    durationMinutes: 60,
    hours: parseWeeklyHours("Mo-Fr 10:00-19:00, Sa-Su 10:00-18:00")!,
    busy,
    rules: { stepMinutes: 30, bufferMinutes: 30, minLeadHours: 24, maxDaysAhead: 60 },
    now: kstMidnight("2026-10-11"),
    today: "2026-10-11",
  });
  assert.equal(days[0].starts.length, 17, "19일은 그대로 열려 있어야 한다");
  assert.deepEqual(days[1].starts, [], "20일은 막혀야 한다");
  assert.equal(days[2].starts.length, 17, "21일은 그대로 열려 있어야 한다");
});

test("예약 화면: 아워플레이스 시간 일정 앞뒤로 30분 텀이 붙는다", () => {
  // 13:00~14:00 예약 → 1시간 촬영은 11:30 시작(12:30 종료 + 텀 30분)까지, 14:30 시작부터 가능
  const busy = busyFromIcs(calendar(hourplace("20261020T130000", "20261020T140000")), OCT_RANGE);
  const [day] = rangeSlots({
    from: "2026-10-20",
    days: 1,
    durationMinutes: 60,
    hours: parseWeeklyHours("Mo-Fr 10:00-19:00")!,
    busy,
    rules: { stepMinutes: 30, bufferMinutes: 30, minLeadHours: 24, maxDaysAhead: 60 },
    now: kstMidnight("2026-10-11"),
    today: "2026-10-11",
  });
  assert.ok(day.starts.includes("11:30"));
  for (const blocked of ["12:00", "12:30", "13:00", "13:30", "14:00"]) {
    assert.ok(!day.starts.includes(blocked), `${blocked} 은 막혀야 한다`);
  }
  assert.ok(day.starts.includes("14:30"));
});
