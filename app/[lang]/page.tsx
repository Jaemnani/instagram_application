import { notFound } from "next/navigation";

import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { FadeTransition } from "@/components/FadeTransition";
import { LocationCard } from "@/components/LocationCard";
import { MarqueeRibbon } from "@/components/MarqueeRibbon";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { SectionSign } from "@/components/SectionSign";
import { ServiceGrid } from "@/components/ServiceGrid";
import { Statement } from "@/components/Statement";
import Image from "next/image";

import { hasLocalBusinessData, instagramUrl, siteConfig } from "@/lib/config";
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
  className = "",
  overlay,
  page = false,
}: {
  id: string;
  children: React.ReactNode;
  bordered?: boolean;
  tone?: "base" | "tinted" | "dark";
  className?: string;
  /** 최대폭 제약을 받지 않고 섹션 전체를 가로지르는 장식 레이어 */
  overlay?: React.ReactNode;
  /**
   * 한 화면을 통째로 쓰는 장면. 데스크톱에서 휠 한 번에 이 장면에 딱 걸린다.
   * 높이는 min-h 라서 콘텐츠가 길어지면(FAQ 펼침 등) 자연히 늘어난다.
   */
  page?: boolean;
}) {
  const toneClass = tone === "tinted" ? "bg-ivory-100" : tone === "dark" ? "bg-ink-900" : "";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`relative ${bordered && tone !== "dark" ? "border-b border-ivory-200" : ""} ${toneClass} ${
        page ? "snap-page flex min-h-svh flex-col justify-center" : ""
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

      <Statement dict={dict} lang={locale} />

      {/* 이야기 + 촬영 종류를 한 장면에 나란히 — 휠 한 번으로 스튜디오를 파악한다 */}
      <Section id="story" page tone="tinted" bordered={false} className="grid-paper">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <SectionHeading
                id="story-heading"
                eyebrow={dict.story.eyebrow}
                title={dict.story.title}
                display="Story"
              />
            </Reveal>

            <Reveal className="mt-6">
              <p className="text-sm leading-[1.85] text-ink-600">
                <span className="wordmark text-ink-900">{siteConfig.name}</span>
                {/* 한국어 상호를 한 번은 남겨야 "키딩성수" 검색에 잡힌다 (한국어 페이지 한정) */}
                {locale === "ko" && siteConfig.nameKo && (
                  <span className="text-ink-800">({siteConfig.nameKo})</span>
                )}
                {dict.story.intro} {dict.story.lead}
              </p>
            </Reveal>

            <div className="mt-8 space-y-5">
              {dict.story.items.map((st) => (
                <Reveal as="article" key={st.heading}>
                  <h3 className="font-serif text-base font-bold leading-snug text-ink-900">
                    {st.heading}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.7] text-ink-600">{st.body}</p>
                </Reveal>
              ))}
            </div>
          </div>

          {/* JSON-LD 의 OfferCatalog @id(#services)와 이어지는 앵커를 유지한다 */}
          <div id="services">
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
              <ServiceGrid dict={dict} compact />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 사진이 주인공인 섹션 — 다크 밴드 위에서 사진 색이 가장 잘 산다 */}
      <Section
        id="gallery"
        tone="dark"
        page
        className="z-10 -mt-8 rounded-t-[2rem] shadow-[0_-24px_60px_rgba(28,25,23,0.35)] lg:-mt-16 lg:rounded-t-[4rem]"
      >
        {/* 곰돌이 스티커 — 아치 경계를 가로질러 크게 붙는다(경계 무시가 포인트).
            Reveal 로 감싸 스크롤 진입 시 아래에서 떠오르며 자리잡는다. */}
        <Reveal className="pointer-events-none absolute -top-16 right-3 z-10 w-52 sm:-top-24 sm:w-72 lg:-top-32 lg:right-10 lg:w-[27rem]">
          <Image
            src="/brand/sticker-cam-bear.webp"
            alt=""
            aria-hidden="true"
            width={900}
            height={497}
            className="w-full rotate-6"
          />
        </Reveal>
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
          <Reveal className="mt-8">
            <PostCard post={featured} lang={locale} dict={dict} featured tone="dark" />
          </Reveal>
        )}
      </Section>

      {/*
        나머지 촬영은 다음 장면으로 넘긴다 — 한 장면이 뷰포트를 넘으면 mandatory
        스냅이 그 구간을 건너뛸 수 없게 되어(스냅 지점 간격 > 화면 높이) 스크롤이
        갇힌다. 장면은 항상 한 화면 안에 들어가야 한다.
      */}
      {rest.length > 0 && (
        <section
          aria-label={dict.gallery.title}
          className="snap-page dot-grid-dark relative flex min-h-svh flex-col justify-center bg-ink-900"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            {/*
              가로 스크롤 스트립 대신 그리드를 쓴다 — 가로 스크롤러는 자기 위에 온
              세로 휠을 삼켜서(또는 스냅 임계를 못 넘겨) 다음 장면으로 넘어가지
              못하게 만든다. 그리드는 그 충돌이 원천적으로 없다.
              한 화면에 담기도록 8장까지만 싣고, 나머지는 인스타그램으로 보낸다.
            */}
            <Reveal>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {rest.slice(0, 8).map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} lang={locale} dict={dict} tone="dark" compact />
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="mt-8 text-center">
              <a
                href={instagramUrl(profile.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs uppercase tracking-[0.2em] text-clay-400 transition-colors hover:text-ivory-50"
              >
                {dict.ui.viewOnInstagram}
              </a>
            </Reveal>
          </div>
        </section>
      )}

      {/* 다크 갤러리 직후 밝은 종이로 복귀 — 이번엔 종이가 다크를 덮으며 올라온다 */}
      <Section
        id="faq"
        page
        bordered={false}
        className="z-10 -mt-8 rounded-t-[2rem] bg-ivory-50 shadow-[0_-24px_60px_rgba(28,25,23,0.18)] lg:-mt-16 lg:rounded-t-[4rem]"
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

      <Section id="location" page tone="tinted" bordered={false}>
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

      {/* 숨 고르기 한 장면 — 곰돌이와 카메라만 떠올랐다가, 다음 장면에서 예약으로 */}
      {bookingUrl && hasLocalBusinessData() && b && <FadeTransition />}

      {/* 대형 예약 섹션 — 히어로와 짝을 이루는 다크 북엔드 */}
      {bookingUrl && hasLocalBusinessData() && b && (
        <Section
          id="book"
          page
          tone="dark"
          bordered={false}
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
    </>
  );
}
