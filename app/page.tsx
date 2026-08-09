import Link from "next/link";

import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { LocationCard } from "@/components/LocationCard";
import { PostCard } from "@/components/PostCard";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceGrid } from "@/components/ServiceGrid";
import { siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";
import { imageGalleryLd, offerCatalogLd } from "@/lib/seo/jsonld";

/** 섹션 래퍼 — 에디토리얼 리듬(넓은 상하 여백 + 얇은 구분선)을 일관되게 유지. */
function Section({
  id,
  children,
  bordered = true,
}: {
  id?: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={bordered ? "border-b border-ivory-200" : ""}
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">{children}</div>
    </section>
  );
}

export default async function HomePage() {
  const { profile, posts } = await getInstagramData();
  const [featured, ...rest] = posts;
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <>
      <JsonLd data={[imageGalleryLd(posts), offerCatalogLd()]} />

      <Hero posts={posts} profile={profile} />

      <Section id="services">
        <SectionHeading
          id="services-heading"
          eyebrow="Services"
          title="촬영 종류"
          lead="돌사진부터 가족사진, 성장 기록까지. 아이와 가족의 시기에 맞춰 촬영합니다."
        />
        <ServiceGrid />
      </Section>

      <Section id="gallery">
        <SectionHeading
          id="gallery-heading"
          eyebrow="Gallery"
          title="최근 촬영"
          lead="키딩성수 인스타그램에 올라온 촬영 기록입니다."
        />

        {posts.length === 0 ? (
          <p className="mt-10 rounded-sm border border-dashed border-ivory-300 p-10 text-center text-sm text-ink-400">
            아직 동기화된 게시물이 없습니다. <code>npm run sync</code> 를 실행하세요.
          </p>
        ) : (
          <div className="mt-10 space-y-14">
            <PostCard post={featured} featured />

            {rest.length > 0 && (
              <div className="grid gap-x-8 gap-y-12 border-t border-ivory-200 pt-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      <Section id="faq">
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQ"
          title="자주 묻는 질문"
          lead="예약·위치·주차 등 촬영 전 가장 많이 확인하시는 내용입니다."
        />
        <Faq />
      </Section>

      <Section id="location" bordered={false}>
        <SectionHeading
          id="location-heading"
          eyebrow="Location"
          title="오시는 길"
          lead="서울숲역과 성수역 사이, 성수동에 있습니다."
        />
        <LocationCard />

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-ivory-200 pt-10">
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
            href="/about"
            className="rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-ink-800"
          >
            스튜디오 소개 보기
          </Link>
        </div>
      </Section>
    </>
  );
}
