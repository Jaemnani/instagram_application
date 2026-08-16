import { notFound } from "next/navigation";

import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { LocationCard } from "@/components/LocationCard";
import { PostCard } from "@/components/PostCard";
import { PostStrip } from "@/components/PostStrip";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceGrid } from "@/components/ServiceGrid";
import { hasLocalBusinessData, siteConfig } from "@/lib/config";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { getInstagramData } from "@/lib/data";
import { faqPageLd, imageGalleryLd, offerCatalogLd } from "@/lib/seo/jsonld";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** 섹션 래퍼 — 넓은 상하 여백 + 얇은 구분선으로 리듬을 일정하게 유지한다. */
function Section({
  id,
  children,
  bordered = true,
  tinted = false,
}: {
  id: string;
  children: React.ReactNode;
  bordered?: boolean;
  tinted?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${bordered ? "border-b border-ivory-200" : ""} ${tinted ? "bg-ivory-100" : ""}`}
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

      <Section id="services" tinted>
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

      <Section id="gallery">
        <Reveal>
          <SectionHeading
            id="gallery-heading"
            eyebrow={dict.gallery.eyebrow}
            title={dict.gallery.title}
            lead={dict.gallery.lead}
          />
        </Reveal>

        {posts.length === 0 ? (
          <p className="mt-10 rounded-sm border border-dashed border-ivory-300 p-10 text-center text-sm text-ink-400">
            {dict.gallery.empty}
          </p>
        ) : (
          <div className="mt-10 space-y-14">
            <Reveal>
              <PostCard post={featured} lang={locale} dict={dict} featured />
            </Reveal>

            {rest.length > 0 && (
              <Reveal>
                <PostStrip posts={rest} lang={locale} dict={dict} />
              </Reveal>
            )}
          </div>
        )}
      </Section>

      <Section id="faq" tinted>
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

      <Section id="location" bordered={false}>
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

        {bookingUrl && hasLocalBusinessData() && b && (
          <Reveal className="mt-14 border-t border-ivory-200 pt-12 text-center">
            <p className="font-serif text-xl font-bold text-ink-900 sm:text-2xl">
              {dict.location.ctaTitle}
            </p>
            <p className="mt-3 text-[15px] text-ink-600">{dict.location.ctaBody}</p>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block rounded-full bg-ink-900 px-7 py-3.5 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
            >
              {dict.ui.book}
            </a>
          </Reveal>
        )}
      </Section>
    </>
  );
}
