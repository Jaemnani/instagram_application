import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/instagram/types";

/** 캐러셀·영상 배지 (이미지 위 좌상단) */
function MediaBadge({ post }: { post: Post }) {
  const label =
    post.type === "CAROUSEL_ALBUM"
      ? `사진 ${post.images.length}장`
      : post.type === "VIDEO"
        ? "영상"
        : null;
  if (!label) return null;
  return (
    <span className="absolute left-3 top-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-[11px] font-medium text-ivory-50 backdrop-blur-sm">
      {label}
    </span>
  );
}

/**
 * 에디토리얼 게시물 카드.
 * `featured`는 갤러리 첫 항목용 대형 가로 레이아웃, 기본은 그리드용 세로 레이아웃.
 * 사진 스튜디오이므로 이미지를 크게 쓰고 텍스트는 부제 역할만 한다.
 */
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const cover = post.coverImage;
  const href = `/posts/${post.slug}`;

  return (
    <article className={featured ? "group" : "group flex flex-col"}>
      <div className={featured ? "grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end" : ""}>
        {cover && (
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            className={`relative block overflow-hidden rounded-sm bg-ivory-200 ${
              featured ? "aspect-[4/3] lg:aspect-[3/2]" : "aspect-[4/5]"
            }`}
          >
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              preload={featured}
              sizes={
                featured
                  ? "(max-width: 1024px) 100vw, 700px"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
              }
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <MediaBadge post={post} />
          </Link>
        )}

        <div className={featured ? "" : "mt-5"}>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <time dateTime={post.timestamp}>{formatDate(post.timestamp)}</time>
            {post.likeCount !== undefined && (
              <span>♡ {post.likeCount.toLocaleString("ko-KR")}</span>
            )}
          </div>

          <h3
            className={`mt-2 font-serif font-bold leading-snug text-ink-900 ${
              featured ? "text-2xl sm:text-3xl" : "text-lg"
            }`}
          >
            <Link href={href} className="transition-colors hover:text-clay-600">
              {post.title}
            </Link>
          </h3>

          {post.excerpt && (
            <p
              className={`mt-3 leading-[1.85] text-ink-600 ${
                featured ? "text-[15px] sm:text-base" : "line-clamp-3 text-sm"
              }`}
            >
              {post.excerpt}
            </p>
          )}

          {post.hashtags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-400">
              {post.hashtags.slice(0, featured ? 6 : 3).map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
