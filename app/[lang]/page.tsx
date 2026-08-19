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
import { ServiceGrid } from "@/components/ServiceGrid";
import { StampBadge } from "@/components/StampBadge";
import { Statement } from "@/components/Statement";
import { ZigzagEdge } from "@/components/ZigzagEdge";
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
}: {
  id: string;
  children: React.ReactNode;
  bordered?: boolean;
  tone?: "base" | "tinted" | "dark";
}) {
  const toneClass = tone === "tinted" ? "bg-ivory-100" : tone === "dark" ? "bg-ink-900" : "";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${bordered && tone !== "dark" ? "border-b border-ivory-200" : ""} ${toneClass}`}
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">{children}</div>
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

      {/* 아래가 다크 밴드라 보더 불필요 — 다크 배경 자체가 경계 */}
      <Section id="services" tone="tinted" bordered={false}>
        <Reveal>
          <SectionHeading
            id="services-heading"
            eyebrow={dict.services.eyebrow}
            title={dict.services.title}
            lead={dict.services.lead}
          />
        </Reveal>
        <Reveal>
          <ServiceGrid dict={dict} />
        </Reveal>
      </Section>

      {/* 사진이 주인공인 섹션 — 다크 밴드 위에서 사진 색이 가장 잘 산다 */}
      <ZigzagEdge direction="into" />
      <Section id="gallery" tone="dark">
        <Reveal>
          <SectionHeading
            id="gallery-heading"
            eyebrow={dict.gallery.eyebrow}
            title={dict.gallery.title}
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
      <ZigzagEdge direction="out" />

      {/* 다크 갤러리 직후 밝은 종이로 복귀 — tinted 는 location 으로 넘긴다 */}
      <Section id="faq">
        <Reveal>
          <SectionHeading
            id="faq-heading"
            eyebrow={dict.faq.eyebrow}
            title={dict.faq.title}
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
            lead={dict.location.lead}
          />
        </Reveal>
        <Reveal>
          <LocationCard dict={dict} lang={locale} />
        </Reveal>
      </Section>

      {/* 대형 예약 섹션 — 히어로와 짝을 이루는 다크 북엔드 */}
      {bookingUrl && hasLocalBusinessData() && b && (
        <Section id="book" tone="dark" bordered={false}>
          <Reveal className="relative text-center">
            {/* 좌우 여백의 장식 — 콘텐츠와 겹치지 않는 lg 이상에서만 */}
            <Image
              src="/brand/sticker-cam-bear.webp"
              alt=""
              aria-hidden="true"
              width={900}
              height={497}
              className="pointer-events-none absolute -left-2 top-10 hidden w-44 -rotate-6 lg:block xl:w-52"
            />
            <StampBadge className="pointer-events-none absolute right-0 top-8 hidden h-24 w-24 lg:block xl:h-28 xl:w-28" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay-400">
              {dict.book.eyebrow}
            </p>
            {/* 장식용 대형 타이포 — 실제 제목은 아래 h2 가 담당한다 */}
            <p
              aria-hidden="true"
              className="font-brand mt-4 font-bold uppercase leading-none text-ivory-50"
              style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
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
