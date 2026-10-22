import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeLink } from "@/components/HomeLink";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";
import { getDictionary, isLocale, locales, localizedPath, type Locale } from "@/lib/i18n";
import { breadcrumbLd, imageGalleryLd } from "@/lib/seo/jsonld";
import { languageAlternates } from "@/lib/seo/metadata";

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
    title: dict.gallery.pageTitle,
    description: `${siteConfig.name} — ${dict.gallery.metaDescription}`,
    alternates: {
      canonical: localizedPath(lang, "/gallery"),
      languages: languageAlternates("/gallery"),
    },
    robots: { index: true, follow: true },
  };
}

/**
 * 촬영 기록 전체 모음. 홈의 가로 갤러리는 최근 몇 개만 보여주고 여기로 이어진다.
 *
 * ⚠️ 스냅 장면(.snap-page)이 없는 일반 스크롤 페이지다. 게시물 수에 따라 길이가
 *    끝없이 늘어나므로 한 화면짜리 장면에 넣으면 스크롤이 흘러간다(CLAUDE.md §1).
 */
export default async function GalleryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const { posts } = await getInstagramData();

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: siteConfig.name, path: localizedPath(locale) },
            { name: dict.gallery.pageTitle, path: localizedPath(locale, "/gallery") },
          ]),
          imageGalleryLd(locale, posts, { path: "/gallery", name: dict.gallery.pageTitle }),
        ]}
      />

      <HomeLink lang={locale} dict={dict} />

      <header className="mt-10 max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay-600">
          {dict.gallery.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
          {dict.gallery.pageTitle}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.9] text-ink-600">{dict.gallery.pageLead}</p>
        {posts.length > 0 && (
          <p className="mt-3 text-xs tabular-nums tracking-[0.06em] text-ink-400">
            {dict.gallery.countLabel(posts.length)}
          </p>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-sm border border-dashed border-ivory-300 p-10 text-center text-sm text-ink-400">
          {dict.gallery.empty}
        </p>
      ) : (
        <ul className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} lang={locale} dict={dict} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
