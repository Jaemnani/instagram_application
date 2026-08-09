import Image from "next/image";
import Link from "next/link";

import { formatDate, formatNumber } from "@/lib/format";
import { localizedPath, type Dictionary, type Locale } from "@/lib/i18n";
import type { Post } from "@/lib/instagram/types";

/** 캐러셀·영상 배지 (이미지 위 좌상단) */
function MediaBadge({ post, dict }: { post: Post; dict: Dictionary }) {
  const label =
    post.type === "CAROUSEL_ALBUM"
      ? dict.ui.photoCount(post.images.length)
      : post.type === "VIDEO"
        ? dict.ui.video
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
 * `featured` 는 갤러리 첫 항목용 대형 가로 레이아웃, 기본은 그리드용 세로 레이아웃.
 */
export function PostCard({
  post,
  lang,
  dict,
  featured = false,
}: {
  post: Post;
  lang: Locale;
  dict: Dictionary;
  featured?: boolean;
}) {
  const cover = post.coverImage;
  const href = localizedPath(lang, `/posts/${post.slug}`);
  const text = post.translations?.[lang];
  const title = text?.title || post.title;
  const excerpt = text?.excerpt ?? post.excerpt;

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
            <MediaBadge post={post} dict={dict} />
          </Link>
        )}

        <div className={featured ? "" : "mt-5"}>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <time dateTime={post.timestamp}>{formatDate(post.timestamp, lang)}</time>
            {post.likeCount !== undefined && <span>♡ {formatNumber(post.likeCount, lang)}</span>}
          </div>

          <h3
            className={`mt-2 font-serif font-bold leading-snug text-ink-900 ${
              featured ? "text-2xl sm:text-3xl" : "text-lg"
            }`}
          >
            <Link href={href} className="transition-colors hover:text-clay-600">
              {title}
            </Link>
          </h3>

          {excerpt && (
            <p
              className={`mt-3 leading-[1.85] text-ink-600 ${
                featured ? "text-[15px] sm:text-base" : "line-clamp-3 text-sm"
              }`}
            >
              {excerpt}
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
