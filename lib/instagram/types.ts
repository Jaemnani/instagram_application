/** Instagram Graph API 원시 응답 타입 (필요한 필드만). */

export interface IgMediaChild {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url: string;
  thumbnail_url?: string;
}

export interface IgMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string; // ISO 8601
  like_count?: number;
  comments_count?: number;
  children?: { data: IgMediaChild[] };
}

export interface IgComment {
  id: string;
  text: string;
  username?: string;
  timestamp?: string;
  like_count?: number;
}

export interface IgProfile {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  profile_picture_url?: string;
  media_count?: number;
  followers_count?: number;
  website?: string;
}

/** ───────── 우리 사이트에서 쓰는 정규화 도메인 모델 ───────── */

export interface SiteImage {
  /** 자체 호스팅 경로 (예: /media/<id>.jpg) */
  src: string;
  width: number;
  height: number;
  /** SEO/접근성/GEO용 의미 있는 대체 텍스트 */
  alt: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  /** ISO 8601 */
  timestamp: string;
  likeCount?: number;
}

export interface Post {
  id: string;
  /** URL 슬러그 (캡션 첫 줄 + id 일부) */
  slug: string;
  /** 제목 (캡션 첫 줄에서 추출) */
  title: string;
  /** 전체 캡션 */
  caption: string;
  /** 메타 description 용 요약 */
  excerpt: string;
  hashtags: string[];
  mentions: string[];
  images: SiteImage[];
  /** 대표 이미지 (그리드/OG용) */
  coverImage: SiteImage | null;
  type: IgMedia["media_type"];
  permalink: string;
  /** ISO 8601 */
  timestamp: string;
  /** 공개 참여지표 */
  likeCount?: number;
  commentsCount?: number;
  /** 댓글 본문 (UGC) */
  comments: Comment[];
}

export interface Profile {
  username: string;
  name: string;
  biography: string;
  profilePicture: SiteImage | null;
  mediaCount: number;
  followersCount?: number;
  website?: string;
}

export interface InstagramData {
  profile: Profile;
  posts: Post[];
  /** 마지막 동기화 시각 (ISO) */
  syncedAt: string;
}
