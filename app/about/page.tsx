import type { Metadata } from "next";
import Link from "next/link";

import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { LocationCard } from "@/components/LocationCard";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceGrid } from "@/components/ServiceGrid";
import { instagramUrl, siteConfig } from "@/lib/config";
import { brandCopy, story, targetKeywords } from "@/lib/content";
import { getInstagramData } from "@/lib/data";
import { breadcrumbLd, faqPageLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "스튜디오 소개 — 촬영 방식 · 위치 · 영업시간",
  description: `${siteConfig.name}은 서울 성동구 성수동의 베이비 스튜디오입니다. 촬영 방식과 촬영 종류, 위치와 영업시간, 주차·예약 안내를 확인하세요.`,
  keywords: [...targetKeywords],
  alternates: { canonical: "/about" },
};

/**
 * 소개 = 읽을거리 + 정보.
 * 홈은 갤러리 쇼케이스만 맡고, 촬영 종류 상세·FAQ·오시는 길은 이 페이지에만 둔다.
 */
export default async function AboutPage() {
  const { profile } = await getInstagramData();
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "스튜디오 소개", path: "/about" },
          ]),
          faqPageLd(),
        ]}
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
      </header>

      {/* 스튜디오 이야기 — 이 페이지에만 있는 본문 */}
      <section
        aria-labelledby="story-heading"
        className="mt-16 border-t border-ivory-200 pt-14"
      >
        <Reveal>
          <SectionHeading id="story-heading" eyebrow="Story" title="어떻게 촬영하나요" />
        </Reveal>

        <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {story.map((s) => (
            <Reveal as="article" key={s.heading}>
              <h3 className="font-serif text-lg font-bold leading-snug text-ink-900">
                {s.heading}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.85] text-ink-600">{s.body}</p>
            </Reveal>
          ))}
        </div>

        {profile.biography && (
          <Reveal className="mt-12">
            <blockquote className="border-l-2 border-clay-500 pl-5">
              <p className="whitespace-pre-line font-serif text-lg leading-[1.8] text-ink-800">
                {profile.biography}
              </p>
              <cite className="mt-3 block text-sm not-italic text-ink-400">
                인스타그램 @{profile.username || siteConfig.instagramHandle}
              </cite>
            </blockquote>
          </Reveal>
        )}
      </section>

      <section
        id="services"
        aria-labelledby="about-services-heading"
        className="mt-16 border-t border-ivory-200 pt-14"
      >
        <Reveal>
          <SectionHeading
            id="about-services-heading"
            eyebrow="Services"
            title="촬영 종류"
            lead="시기와 목적에 따라 촬영을 나눕니다. 자세한 일정과 준비물은 예약 문의 시 안내드립니다."
          />
        </Reveal>
        <Reveal>
          <ServiceGrid />
        </Reveal>
      </section>

      <section
        id="location"
        aria-labelledby="about-location-heading"
        className="mt-16 border-t border-ivory-200 pt-14"
      >
        <Reveal>
          <SectionHeading
            id="about-location-heading"
            eyebrow="Location"
            title="위치 · 영업시간"
            lead="서울숲역과 성수역 사이, 성수동에 있습니다. 촬영은 예약제로 진행됩니다."
          />
        </Reveal>
        <Reveal>
          <LocationCard />
        </Reveal>
      </section>

      <section
        id="faq"
        aria-labelledby="about-faq-heading"
        className="mt-16 border-t border-ivory-200 pt-14"
      >
        <Reveal>
          <SectionHeading id="about-faq-heading" eyebrow="FAQ" title="자주 묻는 질문" />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
      </section>

      <section className="mt-16 border-t border-ivory-200 pt-14">
        <Reveal>
          <h2 className="font-serif text-2xl font-bold text-ink-900">예약 및 문의</h2>
          <p className="mt-3 text-ink-600">
            촬영 예약과 문의는 카카오톡 채널로 받습니다. 최근 촬영은 인스타그램과 홈 갤러리에서
            보실 수 있습니다.
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
            <Link
              href="/#gallery"
              className="rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-ink-800"
            >
              촬영 기록 보기
            </Link>
            <a
              href={instagramUrl(profile.username || siteConfig.instagramHandle)}
              target="_blank"
              rel="noopener noreferrer me"
              className="rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-ink-800"
            >
              Instagram
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
