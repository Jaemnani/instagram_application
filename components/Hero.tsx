import Image from "next/image";

import { brandCopy } from "@/lib/content";
import { siteConfig } from "@/lib/config";
import type { Post, Profile } from "@/lib/instagram/types";

/**
 * 홈 히어로 — 세리프 대형 헤드라인 + 비대칭 이미지 콜라주.
 * h1은 검색어(지역·업종·서비스)를 담고, 사진 스튜디오답게 이미지를 크게 쓴다.
 */
export function Hero({ posts, profile }: { posts: Post[]; profile: Profile }) {
  const bookingUrl = siteConfig.bookingUrl || profile.website;
  // 콜라주용 대표 이미지 3장 (플레이스홀더 SVG는 제외)
  const shots = posts
    .map((p) => p.coverImage)
    .filter((img): img is NonNullable<typeof img> => !!img && !img.src.endsWith(".svg"))
    .slice(0, 3);

  return (
    <section className="border-b border-ivory-200">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-clay-500">
            {brandCopy.tagline}
          </p>

          {/* 'baby studio'/'스튜디오' 같은 복합어가 줄 중간에 끊기지 않도록 줄을 직접 나눈다. */}
          {/* 크기는 실측 기준: 1024px(2열)에서 텍스트 칼럼이 479px 라 48px 은 넘친다 → xl 부터만 48px */}
          <h1 className="mt-5 font-serif text-[2rem] font-bold leading-[1.2] text-ink-900 sm:text-[2.5rem] xl:text-5xl">
            {/* nowrap 은 sm 이상에서만 — 좁은 화면에서는 가로 스크롤이 생긴다 */}
            <span className="block sm:whitespace-nowrap">{brandCopy.heading}</span>
            <span className="mt-2 block text-ink-400 sm:whitespace-nowrap">
              {brandCopy.headingAccent}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-[1.9] text-ink-600 sm:text-base">
            {brandCopy.lead}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
              >
                촬영 예약 문의
              </a>
            )}
            <a
              href="#services"
              className="rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-ink-800"
            >
              촬영 종류 보기
            </a>
          </div>
        </div>

        {shots.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden="true">
            {/* 왼쪽: 세로로 긴 한 장 — 비대칭 리듬의 축 */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-ivory-200">
              <Image
                src={shots[0].src}
                alt=""
                fill
                preload
                sizes="(max-width: 1024px) 50vw, 320px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {shots.slice(1, 3).map((img, i) => (
                <div
                  key={img.src}
                  className={`relative overflow-hidden rounded-sm bg-ivory-200 ${
                    i === 0 ? "aspect-square" : "aspect-[4/5]"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 320px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
