import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";

import type { InstagramData, Post } from "@/lib/instagram/types";

const DATA_FILE = path.join(process.cwd(), "data", "instagram.json");

const EMPTY: InstagramData = {
  profile: {
    username: "",
    name: "",
    biography: "",
    profilePicture: null,
    mediaCount: 0,
  },
  posts: [],
  syncedAt: "",
};

/** 동기화된 데이터를 읽는다 (요청당 1회 캐시). 파일이 없으면 빈 데이터. */
export const getInstagramData = cache(async (): Promise<InstagramData> => {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as InstagramData;
  } catch {
    return EMPTY;
  }
});

export async function getPosts(): Promise<Post[]> {
  return (await getInstagramData()).posts;
}

/** URL 파라미터(퍼센트 인코딩/유니코드 정규화 차이)에 견고하게 매칭. */
function normalizeSlug(s: string): string {
  let decoded = s;
  try {
    decoded = decodeURIComponent(s);
  } catch {
    /* 이미 디코딩된 경우 */
  }
  return decoded.normalize("NFC");
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const target = normalizeSlug(slug);
  return (await getPosts()).find((p) => normalizeSlug(p.slug) === target);
}
