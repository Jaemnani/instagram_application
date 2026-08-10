import Image from "next/image";

import { siteConfig } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { Post, Profile } from "@/lib/instagram/types";

/**
 * 첫 화면 — 사진이 화면을 가득 채우고 가운데 워드마크만 놓는다.
 * 휠을 내리면 바로 본문으로 이어지도록 아래에 스크롤 신호를 둔다.
 * 화면을 떠나는 버튼은 예약 문의 하나뿐이다.
 */
export function Hero({
  posts,
  profile,
  dict,
}: {
  posts: Post[];
  profile: Profile;
  dict: Dictionary;
}) {
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  // 최신 게시물을 그냥 쓰면 이벤트 포스터가 걸릴 수 있어 반응이 가장 좋았던 사진을 기본값으로.
  const usable = posts.filter((p) => p.coverImage && !p.coverImage.src.endsWith(".svg"));
  const picked =
    usable.find((p) => p.id === siteConfig.heroPostId) ??
    usable.reduce<(typeof usable)[number] | null>(
      (best, p) => (!best || (p.likeCount ?? 0) > (best.likeCount ?? 0) ? p : best),
      null,
    );
  const cover = picked?.coverImage;

  return (
    <section className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ink-900 px-5 py-24 text-center sm:px-8">
      {cover && (
        <Image
          src={cover.src}
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
      )}

      <div aria-hidden="true" className="absolute inset-0 bg-ink-900/45" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink-900/35 via-transparent to-ink-900/70"
      />

      <div className="relative flex flex-col items-center gap-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-ivory-200 sm:text-xs">
          {dict.hero.tagline}
        </p>

        {/* h1 = 브랜드명 + 그 언어의 검색어 한 줄 */}
        <h1 className="flex flex-col items-center gap-4">
          {/* 크기는 .wordmark-hero 가 clamp 로 정한다 — 여기서 계단식으로 주면 넘친다 */}
          <span className="wordmark-hero leading-[1.05] text-ivory-50">
            {siteConfig.name}
          </span>
          <span className="font-serif text-base font-bold leading-snug text-ivory-200 sm:text-2xl">
            {dict.meta.siteTagline}
          </span>
        </h1>

        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 rounded-full bg-ivory-50 px-7 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-clay-500 hover:text-ivory-50"
          >
            {dict.ui.book}
          </a>
        )}
      </div>

      <a
        href="#story"
        aria-label={dict.ui.scrollHint}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-ivory-200 transition-colors hover:text-ivory-50"
      >
        <span className="text-[10px] uppercase tracking-[0.28em]">{dict.ui.scroll}</span>
        <span aria-hidden="true" className="scroll-cue block h-10 w-px bg-ivory-200/60" />
      </a>
    </section>
  );
}
