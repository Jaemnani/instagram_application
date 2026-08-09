import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeLink } from "@/components/HomeLink";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { PostGallery } from "@/components/PostGallery";
import { siteConfig } from "@/lib/config";
import { formatDate, formatNumber } from "@/lib/format";
import { getDictionary, isLocale, locales, localizedPath, type Locale } from "@/lib/i18n";
import { getInstagramData, getPostBySlug, getPosts } from "@/lib/data";
import { breadcrumbLd, imageObjectLd, postLd } from "@/lib/seo/jsonld";
import { postMetadata } from "@/lib/seo/metadata";

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  const posts = await getPosts();
  return locales.flatMap((lang) => posts.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const post = await getPostBySlug(slug);
  return post ? postMetadata(lang, post) : {};
}

export default async function PostPage({ params }: Params) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = getDictionary(locale);
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { posts, profile } = await getInstagramData();
  const related = posts.filter((p) => p.id !== post.id).slice(0, 3);
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  // 번역이 없으면 원문(한국어)으로 폴백한다 — 빈 화면보다 낫다.
  const t = post.translations?.[locale];
  const title = t?.title || post.title;
  const caption = t?.caption || post.caption;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <JsonLd
        data={[
          postLd(locale, post),
          imageObjectLd(post),
          breadcrumbLd([
            { name: siteConfig.name, path: localizedPath(locale) },
            { name: dict.gallery.title, path: `${localizedPath(locale)}#gallery` },
            { name: title, path: localizedPath(locale, `/posts/${post.slug}`) },
          ]),
        ]}
      />

      <HomeLink lang={locale} dict={dict} />

      <article className="mx-auto mt-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <time dateTime={post.timestamp}>{formatDate(post.timestamp, locale)}</time>
            {post.likeCount !== undefined && <span>♡ {formatNumber(post.likeCount, locale)}</span>}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
            {title}
          </h1>
        </header>

        <div className="mt-10">
          <PostGallery
            images={post.images}
            labels={{
              enlarge: post.images.map((_, i) => dict.ui.enlarge(title, i + 1)),
              lightbox: dict.ui.lightboxLabel(title),
              close: dict.ui.close,
              prev: dict.ui.prevPhoto,
              next: dict.ui.nextPhoto,
            }}
          />
        </div>

        {caption && (
          <div className="mt-10 whitespace-pre-line text-[15px] leading-[1.9] text-ink-800">
            {caption}
          </div>
        )}

        {post.hashtags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-400">
            {post.hashtags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        )}

        {post.comments.length > 0 && (
          <section
            className="mt-12 border-t border-ivory-200 pt-8"
            aria-labelledby="comments-heading"
          >
            <h2 id="comments-heading" className="font-serif text-xl font-bold text-ink-900">
              {dict.gallery.comments}
              {post.commentsCount !== undefined
                ? ` ${formatNumber(post.commentsCount, locale)}`
                : ""}
            </h2>
            <ul className="mt-5 space-y-4">
              {post.comments.map((c) => (
                <li key={c.id} className="text-sm leading-relaxed">
                  <span className="font-medium text-ink-900">@{c.author}</span>
                  <span className="ml-2 whitespace-pre-line text-ink-600">{c.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-ivory-200 pt-8">
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
            >
              {dict.ui.book}
            </a>
          )}
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-clay-600 hover:underline"
          >
            {dict.ui.viewOnInstagram}
          </a>
        </div>
      </article>

      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="mt-20 border-t border-ivory-200 pt-14"
        >
          <h2 id="related-heading" className="font-serif text-2xl font-bold text-ink-900">
            {dict.gallery.related}
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} lang={locale} dict={dict} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
