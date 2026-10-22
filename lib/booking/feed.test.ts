/**
 * 막힌 시간 피드 테스트.  npm test  (TZ=UTC npm test 로 Vercel 시간대에서도)
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { buildBusyFeed, padAndMerge } from "./feed";
import { busyFromIcs } from "./sources";
import { kstMidnight } from "./time";

const H = 3600_000;
const day = kstMidnight("2026-10-20");

test("텀(30분)을 앞뒤로 붙이고, 겹치거나 맞닿으면 하나로 합친다", () => {
  const merged = padAndMerge(
    [
      { start: day + 10 * H, end: day + 11 * H }, // 10~11 → 9:30~11:30
      { start: day + 12 * H, end: day + 13 * H }, // 12~13 → 11:30~13:30 (맞닿음 → 합침)
      { start: day + 16 * H, end: day + 17 * H }, // 따로
    ],
    30,
  );
  assert.deepEqual(merged, [
    { start: day + 9.5 * H, end: day + 13.5 * H },
    { start: day + 15.5 * H, end: day + 17.5 * H },
  ]);
});

test("길이 0 이하 구간은 버린다", () => {
  assert.deepEqual(padAndMerge([{ start: day, end: day }], 30), []);
});

test("왕복: 피드를 다시 읽으면 텀 포함 구간이 그대로 나온다 (서버 시간대 무관)", () => {
  const intervals = padAndMerge([{ start: day + 14 * H, end: day + 16 * H }], 30);
  const ics = buildBusyFeed(intervals, { now: Date.UTC(2026, 9, 19) });
  const busy = busyFromIcs(ics, { start: kstMidnight("2026-10-01"), end: kstMidnight("2026-11-01") });
  assert.deepEqual(busy, [{ start: day + 13.5 * H, end: day + 16.5 * H }]);
});

test("피드에는 시간만 — 이름·채널 같은 정보가 들어가지 않는다", () => {
  const ics = buildBusyFeed([{ start: day, end: day + H }], { now: Date.UTC(2026, 9, 19) });
  assert.match(ics, /SUMMARY:kidding 예약 마감/);
  assert.doesNotMatch(ics, /DESCRIPTION|HJ|대기|010-/);
  assert.match(ics, /TRANSP:OPAQUE/); // 가져가는 쪽이 '한가함'으로 보지 않게
});

test("빈 피드도 올바른 캘린더 형식이다", () => {
  const ics = buildBusyFeed([], { now: Date.UTC(2026, 9, 19) });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n[\s\S]*END:VCALENDAR\r\n$/);
});
