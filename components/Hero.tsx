import Image from "next/image";

import { siteConfig } from "@/lib/config";
import { brandCopy } from "@/lib/content";
import type { Post, Profile } from "@/lib/instagram/types";

/**
 * 풀블리드 히어로 — 대형 사진 위에 타이포를 얹는다.
 *
 * 사진이 전부 세로(비율 0.75~0.80)라 가로로 넓은 화면에서는 위아래가 크게 잘린다.
 * → 모바일은 세로에 가깝게, 데스크탑은 화면 높이에 맞춰 잘림을 조절한다.
 */
export function Hero({ posts, profile }: { posts: Post[]; profile: Profile }) {
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  // 배경 사진 고르기.
  // 최신 게시물을 그냥 쓰면 이벤트 포스터·공지 이미지가 걸릴 수 있어(로고만 크게 박힌 그림),
  // 기본값은 반응이 가장 좋았던 게시물의 사진으로 둔다. HERO_POST_ID 로 직접 지정 가능.
  const usable = posts.filter((p) => p.coverImage && !p.coverImage.src.endsWith(".svg"));
  const picked =
    usable.find((p) => p.id === siteConfig.heroPostId) ??
    usable.reduce<(typeof usable)[number] | null>(
      (best, p) => (!best || (p.likeCount ?? 0) > (best.likeCount ?? 0) ? p : best),
      null,
    );
  const cover = picked?.coverImage;

  return (
    <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-ink-900 sm:min-h-[86svh]">
      {cover && (
        <Image
          src={cover.src}
          alt=""
          fill
          preload
          sizes="100vw"
          // 인물이 대체로 위쪽에 오므로 상단을 살린다.
          className="object-cover object-[center_28%]"
        />
      )}

      {/* 텍스트 가독성용 스크림 — 아래로 갈수록 짙게 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink-900/55 via-ink-900/35 to-ink-900/90"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-36">
        {/* 워드마크를 크게 — 로고 원본처럼 얇고 자간을 넓혀서 */}
        <p className="wordmark-lg text-xl text-ivory-50 sm:text-3xl lg:text-4xl">
          {siteConfig.name}
        </p>

        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.3em] text-ivory-200 sm:text-xs">
          {brandCopy.tagline}
        </p>

        <h1 className="mt-5 font-serif text-[2rem] font-bold leading-[1.18] text-ivory-50 sm:text-[2.75rem] lg:text-[3.25rem]">
          <span className="block sm:whitespace-nowrap">{brandCopy.heading}</span>
          <span className="mt-1 block text-ivory-300 sm:whitespace-nowrap">
            {brandCopy.headingAccent}
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-[15px] leading-[1.9] text-ivory-200 sm:text-base">
          {brandCopy.lead}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ivory-50 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-clay-500 hover:text-ivory-50"
            >
              촬영 예약 문의
            </a>
          )}
          <a
            href="#gallery"
            className="rounded-full border border-ivory-50/40 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:border-ivory-50"
          >
            촬영 기록 보기
          </a>
        </div>
      </div>
    </section>
  );
}
