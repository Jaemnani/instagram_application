import type { Metadata } from "next";
import Link from "next/link";

import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { LocationCard } from "@/components/LocationCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceGrid } from "@/components/ServiceGrid";
import { instagramUrl, siteConfig } from "@/lib/config";
import { brandCopy, targetKeywords } from "@/lib/content";
import { getInstagramData } from "@/lib/data";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "스튜디오 소개 — 위치·영업시간·촬영 안내",
  description: `${siteConfig.name}은 서울 성동구 성수동의 베이비 스튜디오입니다. 돌사진·가족사진·백일 및 성장 사진 촬영과 스튜디오 대여, 위치와 영업시간을 안내합니다.`,
  keywords: [...targetKeywords],
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { profile } = await getInstagramData();
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <JsonLd
        data={breadcrumbLd([
          { name: "홈", path: "/" },
          { name: "스튜디오 소개", path: "/about" },
        ])}
      />

      <nav aria-label="탐색 경로" className="text-sm text-ink-400">
        <Link href="/" className="hover:text-ink-900">
          홈
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-ink-600">스튜디오 소개</span>
      </nav>

      <header className="mt-8 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-clay-500">
          {brandCopy.tagline}
        </p>
        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
          성수동 베이비 스튜디오 {siteConfig.name}
        </h1>
        <p className="mt-6 text-[15px] leading-[1.9] text-ink-600 sm:text-base">
          {brandCopy.lead}
        </p>
        {profile.biography && (
          <p className="mt-6 whitespace-pre-line border-l-2 border-ivory-300 pl-5 text-[15px] leading-[1.9] text-ink-600">
            {profile.biography}
          </p>
        )}
      </header>

      <section aria-labelledby="about-services-heading" className="mt-16 border-t border-ivory-200 pt-14">
        <SectionHeading id="about-services-heading" eyebrow="Services" title="촬영 종류" />
        <ServiceGrid />
      </section>

      <section aria-labelledby="about-location-heading" className="mt-16 border-t border-ivory-200 pt-14">
        <SectionHeading
          id="about-location-heading"
          eyebrow="Location"
          title="위치 · 영업시간"
          lead="서울숲역과 성수역 사이, 성수동에 있습니다. 촬영은 예약제로 진행됩니다."
        />
        <LocationCard />
      </section>

      <section aria-labelledby="about-faq-heading" className="mt-16 border-t border-ivory-200 pt-14">
        <SectionHeading id="about-faq-heading" eyebrow="FAQ" title="자주 묻는 질문" />
        <Faq />
      </section>

      <section className="mt-16 border-t border-ivory-200 pt-14">
        <h2 className="font-serif text-2xl font-bold text-ink-900">예약 및 문의</h2>
        <p className="mt-3 text-ink-600">
          촬영 예약과 문의는 카카오톡 채널로 받습니다. 최근 촬영은 인스타그램에서 보실 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
            >
              카카오톡으로 예약 문의
            </a>
          )}
          <a
            href={instagramUrl(profile.username || siteConfig.instagramHandle)}
            target="_blank"
            rel="noopener noreferrer me"
            className="rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-ink-800"
          >
            Instagram @{profile.username || siteConfig.instagramHandle}
          </a>
        </div>
      </section>
    </div>
  );
}
