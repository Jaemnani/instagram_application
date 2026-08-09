import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { getDictionary, htmlLang, isLocale, locales, type Locale } from "@/lib/i18n";
import { getInstagramData } from "@/lib/data";
import { baseMetadata } from "@/lib/seo/metadata";
// FAQPage 는 FAQ 가 실제로 보이는 홈에서만 출력한다 (모든 페이지에 뿌리면 스팸 신호).
import { localBusinessLd, organizationLd, webSiteLd } from "@/lib/seo/jsonld";

/**
 * 국문 웹폰트. `subsets` 는 preload 대상만 정하고 한글 글리프는 항상 self-host 되므로
 * (next/font 의 findFontFilesInCss 가 CSS 의 모든 파일을 받는다) latin 만 지정해도 한글이 나온다.
 */
const serif = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const sans = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

/** 워드마크 전용. 로고 서체(Geo Sans Light) 가 없을 때의 폴백. */
const brand = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "700"],
  display: "swap",
});

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {} as Metadata;
  const { profile } = await getInstagramData();
  return baseMetadata(lang, profile);
}

export default async function LocaleLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const { profile } = await getInstagramData();

  return (
    <html
      lang={htmlLang[locale]}
      className={`${serif.variable} ${sans.variable} ${brand.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ivory-50 text-ink-800">
        <JsonLd
          data={[
            organizationLd(locale, profile),
            webSiteLd(locale),
            localBusinessLd(locale, profile),
          ]}
        />

        {/* JS 가 없으면 스크롤 등장 요소가 숨은 채로 남는다 → 보이도록 되돌린다 */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>

        {/*
          상단 고정 헤더 없음 — 히어로 사진이 화면 맨 위부터 온전히 보이게 한다.
          이동은 하위 페이지 상단의 워드마크(홈 링크)와 푸터가 담당한다.
        */}
        <main className="flex-1">{children}</main>

        <SiteFooter lang={locale} dict={dict} profile={profile} />
      </body>
    </html>
  );
}
