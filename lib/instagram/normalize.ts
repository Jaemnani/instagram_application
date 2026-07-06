/** 캡션 파싱 / 슬러그 / alt 텍스트 생성 유틸 (SEO·GEO 핵심). */

import { siteConfig } from "@/lib/config";

const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;
// 이메일(user@domain) 오탐 방지: 앞이 단어문자/점이면 멘션이 아니다. 끝의 점도 아이디에 포함하지 않는다.
const MENTION_RE = /(?<![\w.])@[A-Za-z0-9_](?:[A-Za-z0-9._]*[A-Za-z0-9_])?/g;

export function extractHashtags(caption: string): string[] {
  return [...new Set([...caption.matchAll(HASHTAG_RE)].map((m) => m[0].slice(1)))];
}

export function extractMentions(caption: string): string[] {
  return [...new Set([...caption.matchAll(MENTION_RE)].map((m) => m[0].slice(1)))];
}

/** 코드포인트 기준 안전한 자르기 (서로게이트 페어 파손 방지). */
function truncate(text: string, length: number): string {
  const chars = Array.from(text);
  if (chars.length <= length) return text;
  return chars.slice(0, length).join("").trim() + "…";
}

/** 캡션에서 해시태그/멘션을 제거하고 공백 정리한 본문. */
export function cleanCaption(caption: string): string {
  return caption
    .replace(HASHTAG_RE, "")
    .replace(MENTION_RE, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 제목: 캡션 첫 비어있지 않은 줄(해시태그 제거), 최대 length자. */
export function deriveTitle(caption: string, fallback: string, length = 70): string {
  const firstLine = cleanCaption(caption)
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  const title = (firstLine || fallback).trim();
  return truncate(title, length);
}

/** 메타 description / 요약: 본문에서 length자. */
export function deriveExcerpt(caption: string, length = 160): string {
  const text = cleanCaption(caption).replace(/\s+/g, " ").trim();
  if (!text) return "";
  return truncate(text, length - 1);
}

/** URL-safe 슬러그. 한글/유니코드 문자 보존, id 꼬리표로 유일성 확보. */
export function slugify(title: string, id: string): string {
  const base = Array.from(
    title
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}]+/gu, "-"),
  )
    .slice(0, 60)
    .join("")
    .replace(/^-+|-+$/g, "");
  const suffix = id.replace(/[^A-Za-z0-9]/g, "").slice(-6) || "post";
  return base ? `${base}-${suffix}` : suffix;
}

/** 이미지 alt: 제목 + 인덱스 + 브랜드명을 결합한 서술형. */
export function buildAlt(title: string, index: number, total: number): string {
  const brand = siteConfig.name;
  const suffix = total > 1 ? ` (${index + 1}/${total})` : "";
  const base = title || `${brand} 인스타그램 게시물`;
  return `${base}${suffix} — ${brand}`;
}
