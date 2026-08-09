import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR, Poppins } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";
import { baseMetadata } from "@/lib/seo/metadata";
// FAQPage 는 FAQ 가 실제로 보이는 /about 에서만 출력한다 (모든 페이지에 뿌리면 스팸 신호).
import { localBusinessLd, organizationLd, webSiteLd } from "@/lib/seo/jsonld";

/**
 * 국문 웹폰트. `subsets`는 preload 대상만 정하고 한글 글리프는 항상 self-host 되므로
 * (next/font의 findFontFilesInCss가 CSS의 모든 파일을 받는다) latin만 지정해도 한글이 나온다.
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

/** 워드마크 전용. 로고의 기하학적 산세리프에 가장 가까워 선택. 두 굵기만 받는다. */
const brand = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["200", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getInstagramData();
  return baseMetadata(profile);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getInstagramData();
  const lang = siteConfig.locale.split("_")[0] || "ko";
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <html
      lang={lang}
      className={`${serif.variable} ${sans.variable} ${brand.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ivory-50 text-ink-800">
        <JsonLd data={[organizationLd(profile), webSiteLd(), localBusinessLd(profile)]} />

        {/* JS 가 없으면 스크롤 등장 요소가 숨은 채로 남는다 → 보이도록 되돌린다 */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-sm focus:text-ivory-50"
        >
          본문으로 건너뛰기
        </a>

        <header className="sticky top-0 z-30 border-b border-ivory-200 bg-ivory-50/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <Link href="/" className="wordmark text-base text-ink-900 sm:text-lg">
              {siteConfig.name}
            </Link>

            <nav aria-label="주요 메뉴" className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="rounded-full px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-ivory-200 hover:text-ink-900"
              >
                홈
              </Link>
              <Link
                href="/about"
                className="rounded-full px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-ivory-200 hover:text-ink-900"
              >
                소개
              </Link>
              {bookingUrl && (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
                >
                  예약 문의
                </a>
              )}
            </nav>
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter profile={profile} />
      </body>
    </html>
  );
}
