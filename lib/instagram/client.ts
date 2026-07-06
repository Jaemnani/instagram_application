import type { IgComment, IgMedia, IgProfile } from "./types";

/**
 * Instagram Graph API (Instagram API with Instagram Login) 클라이언트.
 * 장기 토큰(long-lived token)을 사용한다.
 *
 * 환경변수:
 *   IG_LONG_LIVED_TOKEN  — 장기 액세스 토큰 (필수, 라이브 시)
 *   IG_USER_ID           — 인스타그램 비즈니스 계정 ID (선택, 없으면 "me")
 */

const GRAPH_BASE = "https://graph.instagram.com";

/** 미디어 조회 시 요청할 필드 (캐러셀 children + 공개 참여지표 포함) */
const MEDIA_FIELDS =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}";

/** 댓글 조회 필드 (instagram_business_manage_comments 권한 필요) */
const COMMENT_FIELDS = "id,text,username,timestamp,like_count";

const PROFILE_FIELDS =
  "id,username,name,biography,profile_picture_url,media_count,followers_count,website";

export function hasLiveCredentials(): boolean {
  return Boolean(process.env.IG_LONG_LIVED_TOKEN?.trim());
}

function token(): string {
  const t = process.env.IG_LONG_LIVED_TOKEN?.trim();
  if (!t) throw new Error("IG_LONG_LIVED_TOKEN 이 설정되지 않았습니다.");
  return t;
}

function userId(): string {
  return process.env.IG_USER_ID?.trim() || "me";
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token());

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Instagram API ${res.status}: ${body.slice(0, 500)}`);
  }
  return (await res.json()) as T;
}

export async function fetchProfile(): Promise<IgProfile> {
  return graphGet<IgProfile>(userId(), { fields: PROFILE_FIELDS });
}

/** 전체 미디어를 페이지네이션으로 모두 가져온다. */
export async function fetchMedia(maxPages = 50): Promise<IgMedia[]> {
  const out: IgMedia[] = [];
  let after: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, string> = { fields: MEDIA_FIELDS, limit: "50" };
    if (after) params.after = after;

    const data = await graphGet<{
      data: IgMedia[];
      paging?: { cursors?: { after?: string }; next?: string };
    }>(`${userId()}/media`, params);

    out.push(...(data.data ?? []));
    after = data.paging?.next ? data.paging?.cursors?.after : undefined;
    if (!after) break;
  }
  return out;
}

/**
 * 한 미디어의 댓글을 가져온다 (최신순, limit개).
 * instagram_business_manage_comments 권한이 없으면 빈 배열로 폴백.
 */
export async function fetchComments(mediaId: string, limit = 20): Promise<IgComment[]> {
  try {
    const data = await graphGet<{ data: IgComment[] }>(`${mediaId}/comments`, {
      fields: COMMENT_FIELDS,
      limit: String(limit),
    });
    return data.data ?? [];
  } catch (err) {
    console.warn(`댓글 조회 실패(${mediaId}): ${(err as Error).message}`);
    return [];
  }
}

/**
 * 장기 토큰 갱신. 발급 24시간 후부터 가능하며 60일 만료.
 * 50~55일 주기로 호출하여 새 토큰을 시크릿 스토어/환경에 반영해야 한다.
 * @returns 새 토큰과 만료까지 남은 초
 */
export async function refreshToken(): Promise<{ access_token: string; expires_in: number }> {
  return graphGet<{ access_token: string; expires_in: number }>("refresh_access_token", {
    grant_type: "ig_refresh_token",
  });
}
