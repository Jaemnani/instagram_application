import Image from "next/image";
import Link from "next/link";

import { formatDate, formatNumber } from "@/lib/format";
import { localizedPath, type Dictionary, type Locale } from "@/lib/i18n";
import type { Post } from "@/lib/instagram/types";

/**
 * 캐러셀·영상 배지 (이미지 위 좌상단).
 * 영상이면 가운데 재생 버튼도 얹는다 — 정지 이미지와 영상을 한눈에 구별시키는
 * 관습적 기호라, 배지 텍스트보다 먼저 읽힌다. 버튼은 장식(실제 재생은 상세에서).
 */
function MediaBadge({ post, dict }: { post: Post; dict: Dictionary }) {
  const isVideo = post.type === "VIDEO";
  const label =
    post.type === "CAROUSEL_ALBUM"
      ? dict.ui.photoCount(post.images.length)
      : isVideo
        ? dict.ui.video
        : null;
  if (!label) return null;
  return (
    <>
      <span className="absolute left-3 top-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-[11px] font-medium text-ivory-50 backdrop-blur-sm">
        {label}
      </span>
      {isVideo && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ivory-50/90 text-ink-900 shadow-sm transition-transform duration-500 group-hover:scale-110"
        >
          <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
            <path d="M15 8.13a1 1 0 0 1 0 1.74l-13 7.5A1 1 0 0 1 .5 16.5v-15A1 1 0 0 1 2 .63l13 7.5Z" />
          </svg>
        </span>
      )}
    </>
  );
}

/**
 * 에디토리얼 게시물 카드.
 * `featured` 는 갤러리 첫 항목용 대형 가로 레이아웃, 기본은 그리드용 세로 레이아웃.
 * `tone="dark"` 는 ink-900 다크 밴드 위에서 쓴다 — 텍스트를 ivory 계열로 뒤집는다.
 * 날짜 테이프 라벨(ivory-200)은 다크에서도 그대로 두어 스크랩북 팝 포인트가 된다.
 */
export function PostCard({
  post,
  lang,
  dict,
  featured = false,
  tone = "light",
  compact = false,
}: {
  post: Post;
  lang: Locale;
  dict: Dictionary;
  featured?: boolean;
  tone?: "light" | "dark";
  /** 한 화면에 여러 장을 담는 그리드용 — 텍스트를 줄여 카드 높이를 낮춘다 */
  compact?: boolean;
}) {
  const cover = post.coverImage;
  const href = localizedPath(lang, `/posts/${post.slug}`);
  const text = post.translations?.[lang];
  const title = text?.title || post.title;
  const excerpt = text?.excerpt ?? post.excerpt;
  const hashtags = text?.hashtags ?? post.hashtags;
  const dark = tone === "dark";

  return (
    <article className={featured ? "group" : "group flex flex-col"}>
      <div className={featured ? "grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end" : ""}>
        {cover && (
          // 대표 사진은 스크랩북처럼 테이프로 붙인 연출 — 테이프가 사진 밖으로
          // 삐져나와야 해서 overflow-hidden 인 Link 바깥의 래퍼에 얹는다.
          <div className={featured ? "relative" : "contents"}>
            <Link
              href={href}
              tabIndex={-1}
              aria-hidden="true"
              /*
               * compact 는 "한 화면 안에 놓이는" 카드다. lg 이상(풀페이지 스냅이
               * 켜지는 구간)에서는 사진 높이를 뷰포트에 비례시킨다 — 비율로 두면
               * 화면이 낮은 노트북(800px 등)에서 장면이 뷰포트를 넘어, 스냅이 어긋나
               * 스크롤이 흘러간다(실측: 1280×800 에서 갤러리 952px).
               */
              className={`relative block overflow-hidden rounded-sm ${dark ? "bg-ink-800" : "bg-ivory-200"} ${
                featured
                  ? "aspect-[4/3] lg:aspect-[3/2]"
                  : compact
                    ? "aspect-[4/5] lg:aspect-auto lg:h-[27svh]"
                    : "aspect-[4/5]"
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
              {/* 호버 시 나타나는 ↗ 칩 — "카드 = 열 수 있음" 어포던스 (장식, 접근 링크는 제목) */}
              <span
                aria-hidden="true"
                className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-1.5 items-center justify-center rounded-full bg-ivory-50/95 text-ink-900 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 11 L11 3 M5 3 h6 v6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
            {featured && (
              <>
                <Image
                  src="/brand/tape-1.webp"
                  alt=""
                  aria-hidden="true"
                  width={800}
                  height={221}
                  className="pointer-events-none absolute -left-7 -top-3 w-28 -rotate-45 opacity-95 sm:w-32"
                />
                <Image
                  src="/brand/tape-1.webp"
                  alt=""
                  aria-hidden="true"
                  width={800}
                  height={221}
                  className="pointer-events-none absolute -right-7 -top-3 w-28 rotate-45 opacity-95 sm:w-32"
                />
              </>
            )}
          </div>
        )}

        <div className={featured ? "relative" : compact ? "mt-3" : "mt-5"}>
          {/* 세로쓰기 인덱스 탭 — 잡지 색인처럼 텍스트 블록 옆에 붙는다(장식).
              그리드 간격(gap-8) 안쪽에 놓이므로 폭이 확보되는 lg 이상에서만 */}
          {featured && (
            <span
              aria-hidden="true"
              className={`vertical-label absolute -left-9 top-1 hidden rounded-full border px-1.5 py-3 text-[10px] uppercase tracking-[0.25em] lg:block ${
                dark ? "border-ivory-50/25 text-ivory-300/70" : "border-ivory-300 text-ink-400"
              }`}
            >
              Details
            </span>
          )}
          <div
            className={`flex items-center gap-3 text-xs tabular-nums tracking-[0.06em] ${dark ? "text-ivory-300/70" : "text-ink-400"}`}
          >
            {/* 날짜는 마스킹테이프 라벨처럼 — 살짝 기울여 스크랩북 감성을 주되,
                leading-none 으로 행 높이는 바꾸지 않는다(CLS 0). */}
            <time
              dateTime={post.timestamp}
              className="inline-block -rotate-1 bg-ivory-200/90 px-2 py-0.5 text-[11px] leading-none text-ink-600"
            >
              {formatDate(post.timestamp, lang)}
            </time>
            {post.likeCount !== undefined && <span>♡ {formatNumber(post.likeCount, lang)}</span>}
          </div>

          <h3
            className={`mt-2 font-serif font-bold leading-snug ${dark ? "text-ivory-50" : "text-ink-900"} ${
              featured ? "text-2xl sm:text-3xl" : compact ? "text-sm" : "text-lg"
            }`}
          >
            <Link
              href={href}
              className={`transition-colors ${dark ? "hover:text-clay-400" : "hover:text-clay-600"}`}
            >
              {title}
            </Link>
          </h3>

          {excerpt && (
            <p
              className={`mt-3 leading-[1.85] ${dark ? "text-ivory-200/85" : "text-ink-600"} ${
                featured
                  ? "text-[15px] sm:text-base"
                  : compact
                    ? "line-clamp-2 text-xs leading-[1.6]"
                    : "line-clamp-3 text-sm"
              }`}
            >
              {excerpt}
            </p>
          )}

          {hashtags.length > 0 && !compact && (
            <ul
              className={`mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs ${dark ? "text-ivory-300/60" : "text-ink-400"}`}
            >
              {hashtags.slice(0, featured ? 6 : 3).map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
