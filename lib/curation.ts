import { promises as fs } from "node:fs";
import path from "node:path";

import type { Post } from "@/lib/instagram/types";

/**
 * data/curation.json — 사이트에서 뺄 게시물 목록 (커밋해서 쓴다).
 *
 * 인스타에는 촬영 사진 말고도 예약 공지·이벤트 포스터가 올라온다. 자랑용 갤러리에
 * 그런 게 섞이지 않게 사람이 직접 고른다. 해시태그 같은 자동 기준은 캡션을 깜빡하면
 * 새기 때문에 쓰지 않는다.
 */
const CURATION_FILE = path.join(process.cwd(), "data", "curation.json");

type HiddenEntry = { key: string; note?: string };

/** 인스타 주소의 /p/{코드}/ 또는 /reel/{코드}/ 에서 코드만 뽑는다. */
export function shortcodeOf(permalink: string): string | undefined {
  return permalink.match(/\/(?:p|reel|tv)\/([^/?#]+)/)?.[1];
}

/**
 * 형식이 틀리면 **던진다** — "숨길 것 없음"으로 넘기면 숨겨둔 게시물이 갤러리·상세·사이트맵·llms.txt 에
 * 조용히 다시 나온다(Codex P2). `hidden` 오타·배열 아님·알 수 없는 항목 모두 빌드를 멈춘다.
 */
export function parseCuration(raw: string): HiddenEntry[] {
  const data = JSON.parse(raw) as { hidden?: unknown };
  if (!Array.isArray(data.hidden)) {
    throw new Error('data/curation.json: "hidden" 배열이 없습니다 (오타 또는 형식 오류)');
  }
  return data.hidden.map((item, i): HiddenEntry => {
    if (typeof item === "string" && item.trim()) return { key: item.trim() };
    if (item && typeof item === "object" && "key" in item && typeof item.key === "string" && item.key.trim()) {
      return { key: item.key.trim(), note: (item as { note?: string }).note };
    }
    throw new Error(`data/curation.json: hidden[${i}] 형식이 틀렸습니다 — 문자열 또는 { "key": "..." } 이어야 합니다`);
  });
}

function toKeySet(entries: HiddenEntry[]): Set<string> {
  // 주소를 통째로 붙여넣어도 동작하게 — 코드만 남긴다.
  return new Set(entries.map((e) => shortcodeOf(e.key) ?? e.key).filter(Boolean));
}

/** 파일이 없으면 아무것도 숨기지 않는다. 형식이 깨졌으면 빌드를 멈춘다(조용히 다 보이는 것보다 낫다). */
async function readFileOrEmpty(): Promise<string | null> {
  try {
    return await fs.readFile(CURATION_FILE, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function loadHiddenKeys(): Promise<Set<string>> {
  const raw = await readFileOrEmpty();
  return raw === null ? new Set() : toKeySet(parseCuration(raw));
}

export function isHidden(post: Pick<Post, "id" | "permalink">, keys: Set<string>): boolean {
  if (keys.has(post.id)) return true;
  const code = shortcodeOf(post.permalink);
  return code !== undefined && keys.has(code);
}
