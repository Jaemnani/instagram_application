import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import { getPostBySlug, getPosts } from "@/lib/data";
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

  const published = formatDate(post.timestamp);

  return (
    <article className="mx-auto max-w-2xl">
      <JsonLd
        data={[
          postLd(post),
          imageObjectLd(post),
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: post.title, path: `/posts/${post.slug}` },
          ]),
        ]}
      />

      <nav aria-label="breadcrumb" className="mb-4 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900">홈</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-700">{post.title}</span>
      </nav>

      <header className="mb-5">
        <h1 className="text-2xl font-bold leading-snug tracking-tight">{post.title}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-neutral-500">
          <time dateTime={post.timestamp}>{published}</time>
          {post.likeCount !== undefined && (
            <span aria-label="좋아요 수">♥ {post.likeCount.toLocaleString("ko-KR")}</span>
          )}
        </div>
      </header>

      <div className="space-y-3">
        {post.images.map((img, i) => (
          <figure key={i} className="overflow-hidden rounded-lg bg-neutral-100">
            <Image
              src={img.src}
              alt={img.alt}
              width={img.width || 1080}
              height={img.height || 1080}
              preload={i === 0}
              sizes="(max-width: 768px) 100vw, 672px"
              className="h-auto w-full object-cover"
            />
            <figcaption className="sr-only">{img.alt}</figcaption>
          </figure>
        ))}
      </div>

      {post.caption && (
        <div className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-neutral-800">
          {post.caption}
        </div>
      )}

      {post.hashtags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {post.hashtags.map((tag) => (
            <li key={tag} className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
              #{tag}
            </li>
          ))}
        </ul>
      )}

      {post.comments.length > 0 && (
        <section className="mt-8 border-t border-neutral-200 pt-6" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="text-lg font-semibold">
            댓글{post.commentsCount !== undefined ? ` (${post.commentsCount.toLocaleString("ko-KR")})` : ""}
          </h2>
          <ul className="mt-4 space-y-4">
            {post.comments.map((c) => (
              <li key={c.id} className="text-sm">
                <span className="font-medium text-neutral-900">@{c.author}</span>
                <span className="ml-2 whitespace-pre-line text-neutral-700">{c.text}</span>
                {c.likeCount ? (
                  <span className="ml-2 text-xs text-neutral-400">♥ {c.likeCount}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 border-t border-neutral-200 pt-4 text-sm">
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-rose-600 hover:underline"
        >
          인스타그램에서 원본 보기 →
        </a>
      </p>
    </article>
  );
}
