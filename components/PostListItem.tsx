import Image from "next/image";
import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/instagram/types";

/** 블로그형 큰 카드 (홈 리스트). 이미지 + 제목 + 날짜 + 요약 + 해시태그 + 좋아요 수. */
export function PostListItem({ post }: { post: Post }) {
  const cover = post.coverImage;
  return (
    <article className="group flex flex-col gap-4 border-b border-neutral-200 pb-8 sm:flex-row sm:gap-6">
      {cover && (
        <Link
          href={`/posts/${post.slug}`}
          className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:aspect-square sm:w-56"
        >
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width || 600}
            height={cover.height || 600}
            sizes="(max-width: 640px) 100vw, 224px"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
          {post.type === "CAROUSEL_ALBUM" && (
            <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              ◳ {post.images.length}
            </span>
          )}
          {post.type === "VIDEO" && (
            <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
              ▶ 영상
            </span>
          )}
        </Link>
      )}

      <div className="flex flex-1 flex-col">
        <h2 className="text-xl font-bold leading-snug tracking-tight">
          <Link href={`/posts/${post.slug}`} className="hover:text-rose-600">
            {post.title}
          </Link>
        </h2>

        <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
          <time dateTime={post.timestamp}>{formatDate(post.timestamp)}</time>
          {post.likeCount !== undefined && (
            <span aria-label="좋아요 수">♥ {post.likeCount.toLocaleString("ko-KR")}</span>
          )}
        </div>

        {post.excerpt && (
          <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-neutral-700">
            {post.excerpt}
          </p>
        )}

        {post.hashtags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {post.hashtags.slice(0, 6).map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
