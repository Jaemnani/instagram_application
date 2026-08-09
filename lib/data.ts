import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";

import { locales, type Locale } from "@/lib/i18n/config";
import { deriveExcerpt } from "@/lib/instagram/normalize";
import type { InstagramData, Post, PostTranslation } from "@/lib/instagram/types";

const DATA_FILE = path.join(process.cwd(), "data", "instagram.json");
const TRANSLATIONS_FILE = path.join(process.cwd(), "data", "translations.json");

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

/**
 * data/translations.json — 게시물 캡션의 번역 캐시.
 *
 * 커밋해서 쓴다. 번역은 로컬에서 `npm run translate` 로 채우고, 빌드는 읽기만 한다
 * (빌드 서버에 번역용 자격증명을 두지 않는다).
 */
type TranslationEntry = {
  /** 번역 당시 원문 캡션의 해시. 캡션이 수정되면 값이 달라져 재번역 대상이 된다. */
  sourceHash?: string;
  /** excerpt 는 저장하지 않고 caption 에서 파생한다 — 한 곳만 고치면 되게. */
} & Partial<Record<Locale, { title: string; caption: string }>>;

export function captionHash(caption: string): string {
  return createHash("sha256").update(caption).digest("hex").slice(0, 16);
}

async function readTranslations(): Promise<Record<string, TranslationEntry>> {
  try {
    return JSON.parse(await fs.readFile(TRANSLATIONS_FILE, "utf8"));
  } catch {
    return {};
  }
}

/** 캐시의 번역을 게시물에 붙인다. 없는 언어는 비워 두고 화면에서 원문으로 폴백한다. */
function attachTranslations(
  posts: Post[],
  cacheFile: Record<string, TranslationEntry>,
): Post[] {
  return posts.map((post) => {
    const entry = cacheFile[post.id];
    if (!entry) return post;

    const translations: Partial<Record<Locale, PostTranslation>> = {};
    for (const locale of locales) {
      const t = entry[locale];
      if (!t?.caption) continue;
      translations[locale] = {
        title: t.title || post.title,
        caption: t.caption,
        excerpt: deriveExcerpt(t.caption),
      };
    }

    return Object.keys(translations).length ? { ...post, translations } : post;
  });
}

/** 동기화된 데이터를 읽는다 (요청당 1회 캐시). 파일이 없으면 빈 데이터. */
export const getInstagramData = cache(async (): Promise<InstagramData> => {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw) as InstagramData;
    return { ...data, posts: attachTranslations(data.posts, await readTranslations()) };
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
