import Link from "next/link";

import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { hasLocalBusinessData, siteConfig } from "@/lib/config";
import { services } from "@/lib/content";
import { getInstagramData } from "@/lib/data";
import { imageGalleryLd, offerCatalogLd } from "@/lib/seo/jsonld";

/**
 * 홈 = 갤러리 쇼케이스.
 * 촬영 종류 상세·FAQ·오시는 길 전문은 /about 이 담당한다 (같은 내용을 두 페이지에
 * 싣지 않는다 — 중복 콘텐츠는 두 페이지를 서로의 사본으로 보이게 만든다).
 */
export default async function HomePage() {
  const { profile, posts } = await getInstagramData();
  const [featured, ...rest] = posts;
  const bookingUrl = siteConfig.bookingUrl || profile.website;
  const b = siteConfig.business;
  const address = [b.addressRegion, b.addressLocality, b.streetAddress].filter(Boolean).join(" ");

  return (
    <>
      <JsonLd data={[imageGalleryLd(posts), offerCatalogLd()]} />

      <Hero posts={posts} profile={profile} />

      {/* 촬영 종류 — 이름과 한 줄 요약만. 상세 설명은 /about */}
      <section id="services" aria-labelledby="services-heading" className="border-b border-ivory-200">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <SectionHeading
              id="services-heading"
              eyebrow="Services"
              title="이런 촬영을 합니다"
              lead="돌사진부터 가족사진, 성장 기록까지. 아이와 가족의 시기에 맞춰 촬영합니다."
            />
          </Reveal>

          <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <Reveal as="li" key={s.name} className="border-t border-ink-800 pt-4">
                <p className="font-serif text-sm text-clay-500">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-serif text-lg font-bold text-ink-900">{s.name}</h3>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-8">
            <Link
              href="/about#services"
              className="text-sm font-medium text-clay-600 hover:underline"
            >
              촬영 종류 자세히 보기 →
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="gallery" aria-labelledby="gallery-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal>
            <SectionHeading
              id="gallery-heading"
              eyebrow="Gallery"
              title="최근 촬영"
              lead="KIDDING SEONGSU 인스타그램에 올라온 촬영 기록입니다."
            />
          </Reveal>

          {posts.length === 0 ? (
            <p className="mt-10 rounded-sm border border-dashed border-ivory-300 p-10 text-center text-sm text-ink-400">
              아직 동기화된 게시물이 없습니다. <code>npm run sync</code> 를 실행하세요.
            </p>
          ) : (
            <div className="mt-10 space-y-14">
              <Reveal>
                <PostCard post={featured} featured />
              </Reveal>

              {rest.length > 0 && (
                <div className="grid gap-x-8 gap-y-12 border-t border-ivory-200 pt-14 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <Reveal as="article" key={post.id}>
                      <PostCard post={post} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 예약 · 위치 요약 — 전문(찾아오는 길·편의시설·FAQ)은 /about */}
      <section aria-labelledby="visit-heading" className="border-t border-ivory-200 bg-ivory-100">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <Reveal className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay-500">Visit</p>
              <h2
                id="visit-heading"
                className="mt-3 font-serif text-2xl font-bold leading-tight text-ink-900 sm:text-3xl"
              >
                서울숲과 성수역 사이,
                <br />
                성수동에서 만나요
              </h2>
              {hasLocalBusinessData() && address && (
                <address className="mt-4 not-italic leading-relaxed text-ink-600">
                  {address}
                  <span className="mt-1 block text-sm text-ink-400">
                    월–금 10:00–19:00 · 토·일 10:00–18:00 (예약제)
                  </span>
                </address>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                href="/about#location"
                className="rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-ink-800"
              >
                오시는 길 · 자주 묻는 질문
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
