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
