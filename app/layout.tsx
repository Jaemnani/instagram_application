import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";
import { baseMetadata } from "@/lib/seo/metadata";
import { localBusinessLd, organizationLd, webSiteLd } from "@/lib/seo/jsonld";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getInstagramData();
  return baseMetadata(profile);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getInstagramData();
  const lang = siteConfig.locale.split("_")[0] || "ko";

  return (
    <html lang={lang} className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <JsonLd data={[organizationLd(profile), webSiteLd(), localBusinessLd(profile)]} />

        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              {siteConfig.name}
            </Link>
            <nav className="flex items-center gap-5 text-sm text-neutral-600">
              <Link href="/" className="hover:text-neutral-900">홈</Link>
              <Link href="/about" className="hover:text-neutral-900">소개</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>

        <SiteFooter profile={profile} />
      </body>
    </html>
  );
}
