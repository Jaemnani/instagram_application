import { promises as fs } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

import { fetchComments, fetchMedia, fetchProfile, hasLiveCredentials } from "./client";
import {
  buildAlt,
  deriveExcerpt,
  deriveTitle,
  extractHashtags,
  extractMentions,
  fallbackTitle,
  slugify,
} from "./normalize";
import { siteConfig } from "@/lib/config";
import type {
  Comment,
  IgComment,
  IgMedia,
  IgProfile,
  InstagramData,
  Post,
  Profile,
  SiteImage,
} from "./types";
import { loadFixture } from "./fixture";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MEDIA_DIR = path.join(PUBLIC_DIR, "media");
const DATA_FILE = path.join(process.cwd(), "data", "instagram.json");

const DOWNLOAD_TIMEOUT_MS = Number(process.env.IG_DOWNLOAD_TIMEOUT_MS) || 15_000;

/** 이 시각 이전 게시물은 사이트에서 제외한다 (IG_SINCE 로 재정의 가능).
 *  기본값 = 키딩성수 오픈 공지("OPENING SOON") 게시물 시각 — 계정 리브랜딩 이전
 *  (구 23도씨 스튜디오 시절) 게시물 510개를 걸러낸다. */
const SINCE_MS = Date.parse(process.env.IG_SINCE?.trim() || "2026-03-11T05:58:22Z");

/** URL 끝의 /WIDTH/HEIGHT 패턴에서 치수 추정 (placeholder 크기용). */
function guessDims(url: string): { width: number; height: number } {
  const m = url.match(/(\d{2,5})\/(\d{2,5})(?:\?|$)/);
  if (m) return { width: Number(m[1]), height: Number(m[2]) };
  return { width: 1080, height: 1080 };
}

/** 다운로드 실패/오프라인 시 로컬 SVG 플레이스홀더 생성. */
async function writePlaceholder(
  fileBase: string,
  alt: string,
  width: number,
  height: number,
): Promise<SiteImage> {
  const label = alt.replace(/[<>&]/g, "").slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#fca5a5"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" fill="#7c2d12" font-family="sans-serif" font-size="${Math.round(width / 22)}" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;
  const fileName = `${fileBase}.svg`;
  await fs.writeFile(path.join(MEDIA_DIR, fileName), svg, "utf8");
  return { src: `/media/${fileName}`, width, height, alt };
}

/** media_url을 다운로드해 public/media 에 저장하고 SiteImage(치수 포함)를 반환.
 *  네트워크 실패/타임아웃 시 로컬 플레이스홀더로 폴백하여 빌드가 깨지지 않게 한다. */
async function downloadImage(url: string, fileBase: string, alt: string): Promise<SiteImage | null> {
  if (!url) return null;
  const jpgDest = path.join(MEDIA_DIR, `${fileBase}.jpg`);

  // 이미 받은 파일이면 재사용 (증분 동기화)
  try {
    const buffer = await fs.readFile(jpgDest);
    const dim = imageSize(buffer);
    return { src: `/media/${fileBase}.jpg`, width: dim.width ?? 0, height: dim.height ?? 0, alt };
  } catch {
    /* 신규 다운로드로 진행 */
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // CDN이 에러 페이지(HTML)나 비디오 바이트를 200으로 줄 수 있다 → 이미지가 아니면 폴백.
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.startsWith("image/")) {
      throw new Error(`이미지가 아닌 응답: ${contentType}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(jpgDest, buffer);
    let width = 0;
    let height = 0;
    try {
      const dim = imageSize(buffer);
      width = dim.width ?? 0;
      height = dim.height ?? 0;
    } catch {
      /* 치수를 못 읽어도 src는 유효 */
    }
    return { src: `/media/${fileBase}.jpg`, width, height, alt };
  } catch (err) {
    const { width, height } = guessDims(url);
    console.warn(`이미지 다운로드 폴백→placeholder (${fileBase}): ${(err as Error).message}`);
    return writePlaceholder(fileBase, alt, width, height);
  }
}

/** 하나의 미디어에서 자체 호스팅할 이미지 URL 목록을 뽑는다. */
function imageSourcesOf(media: IgMedia): { id: string; url: string }[] {
  if (media.media_type === "CAROUSEL_ALBUM" && media.children?.data) {
    return media.children.data.map((c) => ({
      id: c.id,
      url: c.media_type === "VIDEO" ? (c.thumbnail_url ?? c.media_url) : c.media_url,
    }));
  }
  if (media.media_type === "VIDEO") {
    return [{ id: media.id, url: media.thumbnail_url ?? media.media_url ?? "" }];
  }
  return [{ id: media.id, url: media.media_url ?? "" }];
}

function normalizeComments(raw: IgComment[]): Comment[] {
  return raw
    .filter((c) => c.text?.trim())
    .map((c) => ({
      id: c.id,
      text: c.text.trim(),
      author: c.username || "instagram_user",
      timestamp: c.timestamp ?? "",
      likeCount: c.like_count,
    }));
}

async function normalizeMedia(media: IgMedia, rawComments: IgComment[]): Promise<Post> {
  const caption = media.caption ?? "";
  const hashtags = extractHashtags(caption);
  const title = deriveTitle(
    caption,
    fallbackTitle(hashtags, media.timestamp, siteConfig.name),
  );
  const sources = imageSourcesOf(media);

  const images: SiteImage[] = [];
  for (let i = 0; i < sources.length; i++) {
    const { id, url } = sources[i];
    const img = await downloadImage(url, id, buildAlt(title, i, sources.length));
    if (img) images.push(img);
  }

  return {
    id: media.id,
    slug: slugify(title, media.id),
    title,
    caption,
    excerpt: deriveExcerpt(caption),
    hashtags,
    mentions: extractMentions(caption),
    images,
    coverImage: images[0] ?? null,
    type: media.media_type,
    permalink: media.permalink,
    timestamp: media.timestamp,
    likeCount: media.like_count,
    commentsCount: media.comments_count,
    comments: normalizeComments(rawComments),
  };
}

async function normalizeProfile(p: IgProfile): Promise<Profile> {
  const profilePicture = p.profile_picture_url
    ? await downloadImage(
        p.profile_picture_url,
        `profile-${p.id}`,
        `${p.name || p.username} 프로필 사진`,
      )
    : null;

  return {
    username: p.username,
    name: p.name || p.username,
    biography: p.biography ?? "",
    profilePicture,
    mediaCount: p.media_count ?? 0,
    followersCount: p.followers_count,
    website: p.website,
  };
}

/**
 * 전체 동기화: 프로필 + 미디어를 가져와(또는 fixture) 이미지 자체 호스팅 후
 * data/instagram.json 으로 기록한다.
 */
export async function syncInstagram(): Promise<InstagramData> {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

  const live = hasLiveCredentials();
  console.log(live ? "▶ 라이브 Instagram API 동기화" : "▶ 자격증명 없음 → fixture 사용");

  const fixture = live ? null : loadFixture();
  const rawProfile = live ? await fetchProfile() : fixture!.profile;
  const allMedia = live ? await fetchMedia() : fixture!.media;
  const rawMedia = allMedia.filter((m) => Date.parse(m.timestamp) >= SINCE_MS);
  if (rawMedia.length < allMedia.length) {
    console.log(`  − 기준 시각 이전 게시물 ${allMedia.length - rawMedia.length}개 제외`);
  }

  const profile = await normalizeProfile(rawProfile);
  const posts: Post[] = [];
  for (const m of rawMedia) {
    // 댓글이 없는 게시물은 API 호출을 생략한다 (rate limit 절약).
    const rawComments = live
      ? (m.comments_count ?? 0) > 0
        ? await fetchComments(m.id)
        : []
      : (fixture!.comments[m.id] ?? []);
    posts.push(await normalizeMedia(m, rawComments));
  }

  posts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  dedupeTitles(posts);

  const data: InstagramData = {
    // 게시물 수 표기는 API 전체 수가 아니라 사이트에 실제 노출되는 수와 일치시킨다.
    profile: { ...profile, mediaCount: posts.length },
    posts,
    syncedAt: new Date().toISOString(),
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  await pruneOrphanMedia(data);
  console.log(`✔ ${posts.length}개 게시물 동기화 → ${path.relative(process.cwd(), DATA_FILE)}`);
  return data;
}

/**
 * 같은 캡션을 재사용한 게시물끼리 제목이 겹치면 촬영 시기를 덧붙여 구분한다.
 * 중복 <title>·<h1> 은 검색엔진이 페이지를 서로의 사본으로 보게 만든다.
 * 제목이 바뀌면 슬러그도 다시 만들어 URL 과 제목을 일치시킨다.
 */
function dedupeTitles(posts: Post[]): void {
  const counts = new Map<string, number>();
  for (const p of posts) counts.set(p.title, (counts.get(p.title) ?? 0) + 1);

  const used = new Set<string>();
  for (const p of posts) {
    if ((counts.get(p.title) ?? 0) < 2) {
      used.add(p.title);
      continue;
    }
    const d = new Date(p.timestamp);
    const valid = !Number.isNaN(d.getTime());
    // 촬영 시기로 구분하되, 같은 달에 또 겹치면 날짜까지 쓴다 ("… 2" 같은 순번보다 읽기 좋다).
    const byMonth = valid ? ` (${d.getFullYear()}년 ${d.getMonth() + 1}월)` : "";
    const byDay = valid ? ` (${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일)` : "";
    let next = `${p.title}${byMonth}`;
    if (used.has(next)) next = `${p.title}${byDay}`;
    // 같은 날 같은 캡션까지 겹치는 경우에만 최후 수단으로 순번을 붙인다.
    for (let n = 2; used.has(next); n++) next = `${p.title}${byDay} ${n}`;
    used.add(next);
    p.title = next;
    p.slug = slugify(next, p.id);
  }
}

/** data에서 더 이상 참조하지 않는 미디어 파일 삭제
 *  (인스타에서 삭제된 게시물의 이미지·대체된 플레이스홀더가 잔존 노출되지 않도록). */
async function pruneOrphanMedia(data: InstagramData): Promise<void> {
  const referenced = new Set<string>();
  if (data.profile.profilePicture) referenced.add(path.basename(data.profile.profilePicture.src));
  for (const p of data.posts) for (const im of p.images) referenced.add(path.basename(im.src));

  for (const file of await fs.readdir(MEDIA_DIR)) {
    if (!referenced.has(file)) {
      await fs.rm(path.join(MEDIA_DIR, file));
      console.log(`  − 고아 미디어 삭제: ${file}`);
    }
  }
}
