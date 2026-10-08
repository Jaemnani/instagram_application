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

function parse(raw: string): HiddenEntry[] {
  const data = JSON.parse(raw) as { hidden?: unknown };
  if (!Array.isArray(data.hidden)) return [];
  return data.hidden.flatMap((item): HiddenEntry[] => {
    if (typeof item === "string" && item.trim()) return [{ key: item.trim() }];
    if (item && typeof item === "object" && "key" in item && typeof item.key === "string") {
      return [{ key: item.key.trim(), note: (item as { note?: string }).note }];
    }
    return [];
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
  return raw === null ? new Set() : toKeySet(parse(raw));
}

export function isHidden(post: Pick<Post, "id" | "permalink">, keys: Set<string>): boolean {
  if (keys.has(post.id)) return true;
  const code = shortcodeOf(post.permalink);
  return code !== undefined && keys.has(code);
}
