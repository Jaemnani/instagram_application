import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { LocationCard } from "@/components/LocationCard";
import { PostCard } from "@/components/PostCard";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceGrid } from "@/components/ServiceGrid";
import { siteConfig } from "@/lib/config";
import { brandCopy, story } from "@/lib/content";
import { getInstagramData } from "@/lib/data";
import { faqPageLd, imageGalleryLd, offerCatalogLd } from "@/lib/seo/jsonld";

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

/**
 * 한 페이지 구성.
 * 스튜디오 소개를 따로 두지 않고 첫 화면 아래로 이야기 → 촬영 종류 → 갤러리 →
 * 자주 묻는 질문 → 오시는 길 순으로 이어진다. (/about 은 여기로 영구 이전)
 */
export default async function HomePage() {
  const { profile, posts } = await getInstagramData();
  const [featured, ...rest] = posts;
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <>
      <JsonLd data={[imageGalleryLd(posts), offerCatalogLd(), faqPageLd()]} />

      <Hero posts={posts} profile={profile} />

      <Section id="story">
        <Reveal>
          <SectionHeading id="story-heading" eyebrow="Story" title="어떻게 촬영하나요" />
        </Reveal>

        <Reveal className="mt-8 max-w-3xl">
          <p className="text-[15px] leading-[1.9] text-ink-600 sm:text-base">
            {siteConfig.nameKo && (
              // 한국어 상호를 본문에 한 번은 남겨야 "키딩성수" 검색에 잡힌다.
              <>
                {siteConfig.name}
                <span className="text-ink-800">({siteConfig.nameKo})</span>는 서울 성동구 성수동의
                베이비 스튜디오입니다.{" "}
              </>
            )}
            {brandCopy.lead}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-3">
          {story.map((s) => (
            <Reveal as="article" key={s.heading}>
              <h3 className="font-serif text-lg font-bold leading-snug text-ink-900">
                {s.heading}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.85] text-ink-600">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 촬영 종류 — 별도 페이지로 넘기지 않고 여기서 전부 보여준다 */}
      <Section id="services" tinted>
        <Reveal>
          <SectionHeading
            id="services-heading"
            eyebrow="Services"
            title="촬영 종류"
            lead="돌사진부터 가족사진, 성장 기록까지. 시기와 목적에 맞춰 촬영합니다. 자세한 일정과 준비물은 예약 문의 시 안내드립니다."
          />
        </Reveal>
        <Reveal>
          <ServiceGrid />
        </Reveal>
      </Section>

      <Section id="gallery">
        <Reveal>
          <SectionHeading
            id="gallery-heading"
            eyebrow="Gallery"
            title="최근 촬영"
            lead="인스타그램에 올라온 촬영 기록입니다."
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
      </Section>

      <Section id="faq" tinted>
        <Reveal>
          <SectionHeading
            id="faq-heading"
            eyebrow="FAQ"
            title="자주 묻는 질문"
            lead="예약·위치·주차 등 촬영 전 가장 많이 확인하시는 내용입니다."
          />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
      </Section>

      <Section id="location" bordered={false}>
        <Reveal>
          <SectionHeading
            id="location-heading"
            eyebrow="Location"
            title="오시는 길"
            lead="서울숲역과 성수역 사이, 성수동에 있습니다. 촬영은 예약제로 진행됩니다."
          />
        </Reveal>
        <Reveal>
          <LocationCard />
        </Reveal>

        {bookingUrl && (
          <Reveal className="mt-14 border-t border-ivory-200 pt-12 text-center">
            <p className="font-serif text-xl font-bold text-ink-900 sm:text-2xl">
              촬영을 계획하고 계신가요?
            </p>
            <p className="mt-3 text-[15px] text-ink-600">
              날짜와 아이 개월 수를 알려주시면 가능한 일정을 안내드립니다.
            </p>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-block rounded-full bg-ink-900 px-7 py-3.5 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
            >
              촬영 예약 문의
            </a>
          </Reveal>
        )}
      </Section>
    </>
  );
}
