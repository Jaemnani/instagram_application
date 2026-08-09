import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomeLink } from "@/components/HomeLink";
import { JsonLd } from "@/components/JsonLd";
import { PostCard } from "@/components/PostCard";
import { PostGallery } from "@/components/PostGallery";
import { siteConfig } from "@/lib/config";
import { getInstagramData, getPostBySlug, getPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { breadcrumbLd, imageObjectLd, postLd } from "@/lib/seo/jsonld";
import { postMetadata } from "@/lib/seo/metadata";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return post ? postMetadata(post) : {};
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { posts, profile } = await getInstagramData();
  const related = posts.filter((p) => p.id !== post.id).slice(0, 3);
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <JsonLd
        data={[
          postLd(post),
          imageObjectLd(post),
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "촬영 기록", path: "/#gallery" },
            { name: post.title, path: `/posts/${post.slug}` },
          ]),
        ]}
      />

      <HomeLink />

      <article className="mx-auto mt-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <time dateTime={post.timestamp}>{formatDate(post.timestamp)}</time>
            {post.likeCount !== undefined && (
              <span>♡ {post.likeCount.toLocaleString("ko-KR")}</span>
            )}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
            {post.title}
          </h1>
        </header>

        <div className="mt-10">
          <PostGallery images={post.images} title={post.title} />
        </div>

        {post.caption && (
          <div className="mt-10 whitespace-pre-line text-[15px] leading-[1.9] text-ink-800">
            {post.caption}
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
              댓글
              {post.commentsCount !== undefined
                ? ` ${post.commentsCount.toLocaleString("ko-KR")}`
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
              이런 촬영 예약 문의
            </a>
          )}
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-clay-600 hover:underline"
          >
            인스타그램에서 원본 보기 →
          </a>
        </div>
      </article>

      {related.length > 0 && (
        <section
          aria-labelledby="related-heading"
          className="mt-20 border-t border-ivory-200 pt-14"
        >
          <h2 id="related-heading" className="font-serif text-2xl font-bold text-ink-900">
            다른 촬영 기록
          </h2>
          <div className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
