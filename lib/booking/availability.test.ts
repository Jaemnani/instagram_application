/**
 * 예약 창 자르기 — 공개 API 에 터무니없는 날짜가 와도 캘린더를 읽지 않는다 (Codex P1).
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { clampToBookingWindow } from "./availability";
import { kstMidnight } from "./time";

const today = "2026-10-22";

test("예약 창 안의 구간은 그대로", () => {
  const r = { start: kstMidnight("2026-11-01"), end: kstMidnight("2026-11-30") };
  assert.deepEqual(clampToBookingWindow(r, today, 60), r);
});

test("창을 넘는 부분은 잘린다 (오늘+60일+1일까지)", () => {
  const r = { start: kstMidnight("2026-12-01"), end: kstMidnight("2027-01-31") };
  assert.deepEqual(clampToBookingWindow(r, today, 60), {
    start: kstMidnight("2026-12-01"),
    end: kstMidnight("2026-12-22"),
  });
});

test("9999년·0100년처럼 창과 겹치지 않으면 null — 아무것도 읽지 않는다", () => {
  assert.equal(clampToBookingWindow({ start: kstMidnight("9999-01-01"), end: kstMidnight("9999-02-01") }, today, 60), null);
  assert.equal(clampToBookingWindow({ start: kstMidnight("0100-01-01"), end: kstMidnight("0100-02-01") }, today, 60), null);
});

test("캘린더 주소 해석: 형식이 틀린 항목은 버리지 않고 invalid 로 (조용한 누락 방지)", async () => {
  const { parseCalendarSources } = await import("./config");
  const r = parseCalendarSources("아워=https://a.example/x.ics, 고장=ftp://nope, 이상=https://exa mple.com/x, webcal=webcal://c.example/y.ics");
  assert.deepEqual(r.sources.map((s) => s.label), ["아워", "webcal"]);
  assert.deepEqual(r.invalid, ["고장", "이상"]);
  assert.deepEqual(parseCalendarSources(undefined), { sources: [], invalid: [] });
});

test("애플 설정이 없으면 SIDO 를 '빈 성공'이 아니라 '읽기 실패'로 (Codex P1)", async () => {
  for (const k of ["APPLE_CALDAV_USER", "APPLE_CALDAV_PASSWORD", "APPLE_BOOKING_CALENDAR"]) delete process.env[k];
  const { readAppleBusy } = await import("./icloud");
  const r = await readAppleBusy({ start: 0, end: 86_400_000 });
  assert.equal(r.ok, false);
});
