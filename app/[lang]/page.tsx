import { notFound } from "next/navigation";

import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { LocationCard } from "@/components/LocationCard";
import { MarqueeRibbon } from "@/components/MarqueeRibbon";
import { PostCard } from "@/components/PostCard";
import { PostStrip } from "@/components/PostStrip";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionSign } from "@/components/SectionSign";
import { ServiceGrid } from "@/components/ServiceGrid";
import { StampBadge } from "@/components/StampBadge";
import { Statement } from "@/components/Statement";
import Image from "next/image";

import { hasLocalBusinessData, siteConfig } from "@/lib/config";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { getInstagramData } from "@/lib/data";
import { faqPageLd, imageGalleryLd, offerCatalogLd } from "@/lib/seo/jsonld";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * 섹션 래퍼 — 넓은 상하 여백 + 배경 톤으로 리듬을 만든다.
 * tone: base(ivory-50 종이) / tinted(ivory-100 한 단계 어두운 종이) / dark(ink-900 다크 밴드).
 * 다크 밴드는 배경 대비 자체가 경계라 보더를 그리지 않는다 — 보더는 밝은 이웃끼리만.
 */
function Section({
  id,
  children,
  bordered = true,
  tone = "base",
  fullscreen = false,
  className = "",
  overlay,
  snap = true,
}: {
  id: string;
  children: React.ReactNode;
  bordered?: boolean;
  tone?: "base" | "tinted" | "dark";
  /** 데스크톱에서 뷰포트 한 장을 차지하는 전체화면 섹션 (콘텐츠 세로 중앙) */
  fullscreen?: boolean;
  className?: string;
  /** 최대폭 제약을 받지 않고 섹션 전체를 가로지르는 장식 레이어 */
  overlay?: React.ReactNode;
  /**
   * 휠 스냅 대상 여부.
   * ⚠️ sticky 로 고정되는 섹션에는 반드시 false — position:sticky 요소에
   * scroll-snap-align 이 걸리면 브라우저가 스냅 지점을 sticky 위치로 계속
   * 재계산해 그 지점에 스크롤이 갇힌다(실측: 문서 최대 6991 인데 5258 에서 정지.
   * 스냅만 꺼도, sticky 만 꺼도 정상 복귀 — 둘의 조합이 원인).
   */
  snap?: boolean;
}) {
  const toneClass = tone === "tinted" ? "bg-ivory-100" : tone === "dark" ? "bg-ink-900" : "";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${snap ? "snap-section" : ""} relative ${bordered && tone !== "dark" ? "border-b border-ivory-200" : ""} ${toneClass} ${
        fullscreen ? "lg:flex lg:min-h-svh lg:items-center" : ""
      } ${className}`}
    >
      {overlay}
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">{children}</div>
    </section>
  );
}

/** 한 페이지 구성: 첫 화면 → 이야기 → 촬영 종류 → 갤러리 → FAQ → 오시는 길 */
export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const { profile, posts } = await getInstagramData();
  const [featured, ...rest] = posts;
  const bookingUrl = siteConfig.bookingUrl || profile.website;
  const b = siteConfig.business;

  return (
    <>
      <JsonLd
        data={[imageGalleryLd(locale, posts), offerCatalogLd(locale), faqPageLd(locale)]}
      />

      <Hero posts={posts} profile={profile} dict={dict} lang={locale} />

      <MarqueeRibbon />

      <Statement dict={dict} lang={locale} />

      <Section id="story">
        <Reveal>
          <SectionHeading
            id="story-heading"
            eyebrow={dict.story.eyebrow}
            title={dict.story.title}
            display="Story"
          />
        </Reveal>

        <Reveal className="mt-8 max-w-3xl">
          <p className="text-[15px] leading-[1.9] text-ink-600 sm:text-base">
            <span className="wordmark text-ink-900">{siteConfig.name}</span>
            {/* 한국어 상호를 한 번은 남겨야 "키딩성수" 검색에 잡힌다 (한국어 페이지 한정) */}
            {locale === "ko" && siteConfig.nameKo && (
              <span className="text-ink-800">({siteConfig.nameKo})</span>
            )}
            {dict.story.intro} {dict.story.lead}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {dict.story.items.map((s) => (
            <Reveal as="article" key={s.heading}>
              <h3 className="font-serif text-lg font-bold leading-snug text-ink-900">
                {s.heading}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.85] text-ink-600">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/*
        아치 커튼 — 밝은 종이 섹션이 멈춰 선 채로, 다크 갤러리가 둥근 지붕을 이고
        그 위를 덮으며 올라온다. 장(章)이 넘어가는 감각을 만드는 전환.
        services 높이(약 714px)가 뷰포트보다 작아야 sticky 가 잘리지 않는다.
      */}
      <div className="lg:sticky lg:top-0">
      <Section id="services" tone="tinted" bordered={false} className="grid-paper" snap={false}>
        <Reveal>
          <SectionHeading
            id="services-heading"
            eyebrow={dict.services.eyebrow}
            title={dict.services.title}
            display="Services"
            lead={dict.services.lead}
          />
        </Reveal>
        <Reveal>
          <ServiceGrid dict={dict} />
        </Reveal>
      </Section>

      </div>

      {/* 사진이 주인공인 섹션 — 다크 밴드 위에서 사진 색이 가장 잘 산다 */}
      <Section
        id="gallery"
        tone="dark"
        className="z-10 -mt-6 rounded-t-[2rem] shadow-[0_-24px_60px_rgba(28,25,23,0.35)] lg:rounded-t-[4rem]"
      >
        {/* 곰돌이 스티커 — 지그재그 경계를 가로질러 크게 붙인다 (경계 무시가 포인트) */}
        <Image
          src="/brand/sticker-cam-bear.webp"
          alt=""
          aria-hidden="true"
          width={900}
          height={497}
          className="pointer-events-none absolute -top-16 right-3 z-10 w-52 rotate-6 sm:-top-24 sm:w-72 lg:-top-32 lg:right-10 lg:w-[27rem]"
        />
        <SectionSign caption={dict.gallery.title} />

        <Reveal>
          <SectionHeading
            id="gallery-heading"
            eyebrow={dict.gallery.eyebrow}
            title={dict.gallery.title}
            display="Gallery"
            lead={dict.gallery.lead}
            tone="dark"
          />
        </Reveal>

        {posts.length === 0 ? (
          <p className="mt-10 rounded-sm border border-dashed border-ivory-50/20 p-10 text-center text-sm text-ivory-300/70">
            {dict.gallery.empty}
          </p>
        ) : (
          <div className="mt-10 space-y-14">
            <Reveal>
              <PostCard post={featured} lang={locale} dict={dict} featured tone="dark" />
            </Reveal>

            {rest.length > 0 && (
              <Reveal>
                <PostStrip posts={rest} lang={locale} dict={dict} tone="dark" />
              </Reveal>
            )}
          </div>
        )}
      </Section>

      {/* 다크 갤러리 직후 밝은 종이로 복귀 — 이번엔 종이가 다크를 덮으며 올라온다 */}
      <Section
        id="faq"
        bordered={false}
        className="z-10 -mt-6 rounded-t-[2rem] bg-ivory-50 shadow-[0_-24px_60px_rgba(28,25,23,0.18)] lg:rounded-t-[4rem]"
      >
        <Reveal>
          <SectionHeading
            id="faq-heading"
            eyebrow={dict.faq.eyebrow}
            title={dict.faq.title}
            display="FAQ"
            lead={dict.faq.lead}
          />
        </Reveal>
        <Reveal>
          <Faq dict={dict} />
        </Reveal>
      </Section>

      <Section id="location" tone="tinted" bordered={false}>
        <Reveal>
          <SectionHeading
            id="location-heading"
            eyebrow={dict.location.eyebrow}
            title={dict.location.title}
            display="Location"
            lead={dict.location.lead}
          />
        </Reveal>
        <Reveal>
          <LocationCard dict={dict} lang={locale} />
        </Reveal>
      </Section>

      {/* 대형 예약 섹션 — 히어로와 짝을 이루는 다크 북엔드 */}
      {bookingUrl && hasLocalBusinessData() && b && (
        <Section
          id="book"
          tone="dark"
          bordered={false}
          fullscreen
          className="dot-grid-dark"
          overlay={
            // 대형 타이포를 위아래로 감싸는 흰 사선 띠 — 전체화면이 되는 lg 이상에서만
            <>
              <MarqueeRibbon variant="tilted" className="top-[13%] hidden lg:block" />
              <MarqueeRibbon variant="tilted" reverse className="bottom-[13%] hidden lg:block" />
            </>
          }
        >
          <Reveal className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay-400">
              {dict.book.eyebrow}
            </p>
            {/* 장식용 대형 타이포 — 전체화면을 채우는 피날레. 실제 제목은 아래 h2. */}
            <p
              aria-hidden="true"
              className="font-brand mt-4 font-bold uppercase leading-none text-ivory-50"
              style={{ fontSize: "clamp(3.25rem, 12vw, 10rem)" }}
            >
              Book Now<span className="text-clay-400">.</span>
            </p>
            <h2
              id="book-heading"
              className="mt-8 font-serif text-xl font-bold text-ivory-50 sm:text-2xl"
            >
              {dict.book.title}
            </h2>
            <p className="mt-3 text-[15px] text-ivory-200/85">{dict.book.body}</p>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-full bg-ivory-50 px-8 py-4 text-sm font-medium text-ink-900 transition-colors hover:bg-clay-500 hover:text-ivory-50"
            >
              {dict.ui.book}
            </a>
          </Reveal>
        </Section>
      )}

      {/* 떠다니는 브랜드 스티커 — 페이지 어디서나 우하단에서 천천히 돈다 */}
      <StampBadge className="pointer-events-none fixed bottom-5 right-5 z-40 hidden h-20 w-20 sm:block lg:h-24 lg:w-24" />
    </>
  );
}
