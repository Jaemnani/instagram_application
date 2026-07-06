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
  slugify,
} from "./normalize";
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
  const title = deriveTitle(caption, "인스타그램 게시물");
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
    hashtags: extractHashtags(caption),
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
  const rawMedia = live ? await fetchMedia() : fixture!.media;

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

  const data: InstagramData = {
    profile,
    posts,
    syncedAt: new Date().toISOString(),
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  await pruneOrphanMedia(data);
  console.log(`✔ ${posts.length}개 게시물 동기화 → ${path.relative(process.cwd(), DATA_FILE)}`);
  return data;
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
