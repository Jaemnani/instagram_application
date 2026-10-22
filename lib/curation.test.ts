/**
 * 숨김 목록 해석 — 형식이 틀리면 빈 목록이 아니라 오류 (숨긴 게시물이 조용히 다시 나오지 않게).
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { isHidden, parseCuration, shortcodeOf } from "./curation";

test("정상: 문자열·{key} 항목, 주소를 통째로 넣어도 코드로", () => {
  const entries = parseCuration('{"hidden": ["DWQqWh9AfzE", {"key": "https://www.instagram.com/p/DYg4oYthl0L/", "note": "포스터"}]}');
  assert.equal(entries.length, 2);
  assert.equal(shortcodeOf("https://www.instagram.com/p/DYg4oYthl0L/"), "DYg4oYthl0L");
});

test("빈 배열은 정상 — 숨길 것이 없다는 뜻", () => {
  assert.deepEqual(parseCuration('{"hidden": []}'), []);
});

test("hidden 오타·배열 아님·알 수 없는 항목은 던진다 (Codex P2)", () => {
  assert.throws(() => parseCuration('{"hiden": ["x"]}'), /hidden/);
  assert.throws(() => parseCuration('{"hidden": "DWQqWh9AfzE"}'), /hidden/);
  assert.throws(() => parseCuration('{"hidden": [123]}'), /hidden\[0\]/);
  assert.throws(() => parseCuration('{"hidden": [{"id": "x"}]}'), /hidden\[0\]/);
  assert.throws(() => parseCuration("{ broken"));
});

test("숨김 판정: id 또는 게시물 주소 코드", () => {
  const keys = new Set(["DWQqWh9AfzE", "123"]);
  assert.equal(isHidden({ id: "999", permalink: "https://www.instagram.com/p/DWQqWh9AfzE/" }, keys), true);
  assert.equal(isHidden({ id: "123", permalink: "https://www.instagram.com/p/OTHER/" }, keys), true);
  assert.equal(isHidden({ id: "999", permalink: "https://www.instagram.com/p/OTHER/" }, keys), false);
});
