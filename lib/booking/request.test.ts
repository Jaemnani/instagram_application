/**
 * 예약 신청 → 캘린더 일정 변환 테스트.
 *   npm test   (TZ=UTC npm test 로 Vercel 서버 시간대에서도 확인)
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import ical, { type VEvent } from "node-ical";

import { escapeText, foldLine } from "./ics";
import { parseRequest, requestToIcs } from "./request";
import { busyFromIcs } from "./sources";
import { kstMidnight } from "./time";

const valid = {
  product: "2h",
  date: "2026-10-20",
  time: "14:00",
  name: "홍길동",
  phone: "010-1234-5678",
  memo: "",
  consent: true,
  lang: "ko",
};

test("입력 검증: 정상 신청은 통과", () => {
  const r = parseRequest(valid);
  assert.ok(r.ok);
});

test("입력 검증: 빠진 값·잘못된 값은 해당 칸을 짚는다", () => {
  const cases: [Record<string, unknown>, string][] = [
    [{ product: "3h" }, "product"],
    [{ date: "2026-02-30" }, "date"],
    [{ time: "14:15" }, "time"], // 30분 단위가 아님
    [{ time: "9:00" }, "time"],
    [{ name: "   " }, "name"],
    [{ name: "가".repeat(41) }, "name"],
    [{ phone: "1234" }, "phone"],
    [{ phone: "010-1234-abcd" }, "phone"],
    [{ memo: "가".repeat(501) }, "memo"],
    [{ consent: false }, "consent"],
    [{ consent: "true" }, "consent"], // 문자열 "true" 는 동의로 보지 않는다
  ];
  for (const [patch, field] of cases) {
    const r = parseRequest({ ...valid, ...patch });
    assert.deepEqual(r, { ok: false, field }, JSON.stringify(patch));
  }
});

test("입력 검증: 해외 번호와 공백·괄호는 허용", () => {
  assert.ok(parseRequest({ ...valid, phone: "+81 (90) 1234-5678" }).ok);
});

test("일정 파일: 손님 입력의 쉼표·세미콜론·줄바꿈이 구조를 깨지 않는다", () => {
  assert.equal(escapeText("a,b;c\\d\ne"), "a\\,b\\;c\\\\d\\ne");
  const r = parseRequest({ ...valid, name: "홍길동;DTSTART:20000101T000000Z", memo: "줄1\nEND:VEVENT\nBEGIN:VEVENT" });
  assert.ok(r.ok);
  const ics = requestToIcs(r.request, { uid: "test@kidding.kr", now: Date.UTC(2026, 9, 12), degraded: false });
  const events = Object.values(ical.sync.parseICS(ics)).filter((v) => v?.type === "VEVENT");
  assert.equal(events.length, 1, "손님 입력으로 일정이 하나 더 생기면 안 된다");
});

test("일정 파일: 긴 줄은 75바이트로 접되 한글 글자를 자르지 않는다", () => {
  const folded = foldLine(`DESCRIPTION:${"가".repeat(60)}`);
  for (const line of folded.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.equal(folded.replace(/\r\n /g, ""), `DESCRIPTION:${"가".repeat(60)}`);
});

test("왕복: 만든 신청 일정을 다시 읽으면 정확히 그 시간을 막는다 (서버 시간대 무관)", () => {
  const r = parseRequest(valid);
  assert.ok(r.ok);
  const ics = requestToIcs(r.request, { uid: "t@kidding.kr", now: Date.UTC(2026, 9, 12), degraded: false });
  const busy = busyFromIcs(ics, { start: kstMidnight("2026-10-01"), end: kstMidnight("2026-11-01") });
  const start = kstMidnight("2026-10-20") + 14 * 3600_000;
  assert.deepEqual(busy, [{ start, end: start + 2 * 3600_000 }]);
});

test("일정 내용: 제목은 스튜디오 규칙(HJ …) + [대기]·상품·이름, 본문에 연락처와 처리 안내", () => {
  const r = parseRequest({ ...valid, memo: "돌 촬영" });
  assert.ok(r.ok);
  const ics = requestToIcs(r.request, { uid: "t@kidding.kr", now: Date.UTC(2026, 9, 12), degraded: true });
  const ev = Object.values(ical.sync.parseICS(ics)).find((v) => v?.type === "VEVENT") as VEvent;
  assert.equal(ev.summary, "HJ 홈페이지 kidding [대기] 2시간 촬영 · 홍길동");
  const desc = String(ev.description);
  for (const part of ["010-1234-5678", "돌 촬영", "승인하면 제목의 [대기]를 지우고", "확인하지 못했습니다"]) {
    assert.ok(desc.includes(part), part);
  }
});

test("신청 잠금: 같은 이름 파일이 지금도 그 시간을 차지할 때만 마감 — 옮겨진 일정은 마감 아님 (Codex P2)", async () => {
  const { lockStillHolds } = await import("./icloud");
  const r = parseRequest(valid); // 10/20 14:00, 2시간
  assert.ok(r.ok);
  const { requestInterval } = await import("./request");
  const interval = requestInterval(r.request);
  const here = requestToIcs(r.request, { uid: "a@kidding.kr", now: Date.UTC(2026, 9, 12), degraded: false });
  assert.equal(lockStillHolds(here, interval), true, "그대로 있으면 마감");
  const moved = parseRequest({ ...valid, date: "2026-10-22", time: "11:00" });
  assert.ok(moved.ok);
  const movedIcs = requestToIcs(moved.request, { uid: "a@kidding.kr", now: Date.UTC(2026, 9, 12), degraded: false });
  assert.equal(lockStillHolds(movedIcs, interval), false, "다른 날로 옮겨졌으면 이 시간은 비어 있다");
  assert.equal(lockStillHolds(null, interval), true, "못 읽으면 안전하게 마감으로 본다");
});
