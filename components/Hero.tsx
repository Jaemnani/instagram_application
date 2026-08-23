import Image from "next/image";

import { LanguageBadge } from "@/components/LanguageBadge";
import { siteConfig } from "@/lib/config";
import type { Dictionary, Locale } from "@/lib/i18n";
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
  lang,
}: {
  posts: Post[];
  profile: Profile;
  dict: Dictionary;
  lang: Locale;
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
  // heroImageSrc 가 설정되면(현재 인형 놀이 사진) 게시물 기반 선택보다 우선한다.
  const heroSrc = siteConfig.heroImageSrc || picked?.coverImage?.src;

  return (
    <section /*
       * ⚠️ overflow-hidden 이 아니라 overflow-clip 이다.
       * hidden 은 그 자리에 **스크롤 포트**를 만들어 휠 대상이 이 섹션으로 고정된다.
       * 이 섹션은 스크롤할 게 없으므로 첫 화면에서 휠이 통째로 먹통이 됐다
       * (실측: 커서가 히어로 위일 때 작은 휠 8회에도 y=0).
       * clip 은 넘침을 잘라내는 결과는 같으면서 스크롤 컨테이너가 되지 않는다.
       */
      className="snap-page relative isolate flex min-h-svh flex-col items-center justify-center overflow-clip bg-ink-900 px-5 py-24 text-center sm:px-8">
      {heroSrc && (
        <Image
          src={heroSrc}
          alt=""
          fill
          preload
          sizes="100vw"
          /*
           * 인물(얼굴) bbox 가 잘리지 않도록 세로 기준점을 인물 위치에 맞춘다.
           * 현재 히어로 사진(2560×3840, public/hero/hero.jpg)은 아이 머리카락이
           * 이미지 상단 약 11% 지점에서 시작하고(그 위는 보라색 배경 여백),
           * 활짝 웃는 입/턱은 약 33% 지점이다.
           *
           * object-position 의 Y% 는 "세로 크롭량 중 위쪽에서 잘라낼 비율"이다.
           * 화면이 가로로 넓어질수록(세로 크롭량 자체가 커질수록) 이 비율만큼
           * 잘리는 절대량도 함께 커지므로, Y 를 "머리카락이 시작하는 지점의
           * 비율"(여기서는 10%, 약간 여유를 둔 값)로 고정하면 세로 크롭은 그
           * 지점보다 위쪽은 절대 넘지 않도록 수학적으로 보장된다 — 위쪽 여백만
           * 먼저 깎이고, 그다음부터는 아래쪽(발치의 인형들 — 여백이 넉넉함)에서
           * 잘려 어떤 가로세로 비율에서도 얼굴이 잘리지 않는다.
           *
           * 히어로 사진이 바뀌면(HERO_IMAGE_SRC/HERO_POST_ID 재설정 등) 새 사진에서
           * 인물이 상단 몇 % 지점에서 시작하는지 다시 확인해 이 값을 조정할 것.
           */
          className="object-cover object-[center_10%]"
        />
      )}

      <div aria-hidden="true" className="absolute inset-0 bg-ink-900/45" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink-900/35 via-transparent to-ink-900/70"
      />

      <LanguageBadge lang={lang} label={dict.ui.language} />

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
        /* 보이는 텍스트(SCROLL)가 접근명에 포함돼야 한다 — 음성 제어 사용자가
           "SCROLL 클릭"이라고 말했을 때 이 링크가 잡힌다(WCAG 2.5.3) */
        aria-label={`${dict.ui.scroll} — ${dict.ui.scrollHint}`}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-ivory-200 transition-colors hover:text-ivory-50"
      >
        <span className="text-[10px] uppercase tracking-[0.28em]">{dict.ui.scroll}</span>
        <span aria-hidden="true" className="scroll-cue block h-10 w-px bg-ivory-200/60" />
      </a>
    </section>
  );
}
