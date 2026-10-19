import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookingPicker } from "@/components/BookingPicker";
import { HomeLink } from "@/components/HomeLink";
import { JsonLd } from "@/components/JsonLd";
import { PRODUCTS } from "@/lib/booking/config";
import { bookingRequestsEnabled } from "@/lib/booking/icloud";
import { siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";
import { getDictionary, htmlLang, isLocale, locales, localizedPath, type Locale } from "@/lib/i18n";
import { breadcrumbLd } from "@/lib/seo/jsonld";
import { languageAlternates } from "@/lib/seo/metadata";
import { inquiryLink } from "@/lib/links";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.booking.title,
    description: `${siteConfig.name} — ${dict.booking.metaDescription}`,
    alternates: {
      canonical: localizedPath(lang, "/book"),
      languages: languageAlternates("/book"),
    },
    robots: { index: true, follow: true },
  };
}

/**
 * 예약 페이지. 빈 시간은 클라이언트가 API 로 받아온다 —
 * 페이지 자체는 정적으로 두고 자주 바뀌는 데이터만 런타임에 가져온다
 * (공유 레이아웃에 자주 바뀌는 데이터를 구우면 ISR 에 갇힌다).
 *
 * ⚠️ 이 페이지는 스냅 장면(.snap-page)이 없는 일반 스크롤 페이지다.
 *    달력은 화면 높이를 넘기 쉬워 스냅 장면에 넣으면 스크롤이 흘러간다.
 */
export default async function BookPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const { profile } = await getInstagramData();
  const inquiryUrl = inquiryLink(profile);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <JsonLd
        data={breadcrumbLd([
          { name: siteConfig.name, path: localizedPath(locale) },
          { name: dict.booking.title, path: localizedPath(locale, "/book") },
        ])}
      />

      <HomeLink lang={locale} dict={dict} />

      <p className="mt-10 text-xs font-medium uppercase tracking-[0.2em] text-clay-600">{dict.book.eyebrow}</p>
      <h1 className="mt-3 font-serif text-3xl font-bold text-ink-900">{dict.booking.title}</h1>
      <p className="mt-4 text-[15px] leading-[1.9] text-ink-600">{dict.booking.intro}</p>

      {/* 외국인 손님용 — 네이버 예약 방법을 그 언어로 미리 알려준다. 한국어 페이지에는 필요 없다. */}
      {siteConfig.naverBookingUrl && locale !== "ko" && (
        <section aria-labelledby="naver-guide" className="mt-10 rounded-2xl border border-ivory-300 bg-ivory-100 p-6 sm:p-8">
          <h2 id="naver-guide" className="font-serif text-lg font-bold text-ink-900">
            {dict.booking.naverGuideTitle}
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-800">
            {dict.booking.naverGuideSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-ink-600">{dict.booking.naverGuideHelp}</p>
        </section>
      )}

      <BookingPicker
        htmlLang={htmlLang[locale]}
        strings={dict.booking}
        products={PRODUCTS.map((p) => ({ id: p.id, minutes: p.minutes, name: p.name[locale] }))}
        inquiryUrl={inquiryUrl}
        naverUrl={siteConfig.naverBookingUrl}
        requestsEnabled={bookingRequestsEnabled()}
        lang={locale}
        privacyHref={localizedPath(locale, "/privacy")}
      />
    </div>
  );
}
