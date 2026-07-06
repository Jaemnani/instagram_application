import type { Metadata } from "next";

import { siteConfig } from "@/lib/config";
import type { Post, Profile } from "@/lib/instagram/types";
import { abs } from "@/lib/seo/jsonld";

/** 기본 og:image — 프로필 사진 (SVG 플레이스홀더는 OG 스크레이퍼가 못 읽으므로 제외). */
function defaultOgImages(profile?: Profile) {
  const pic = profile?.profilePicture;
  if (!pic || pic.src.endsWith(".svg")) return undefined;
  return [{ url: abs(pic.src), width: pic.width, height: pic.height, alt: pic.alt }];
}

/** layout 공통 metadata (template, OG 기본값, robots). */
export function baseMetadata(profile?: Profile): Metadata {
  const images = defaultOgImages(profile);
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url: siteConfig.url,
      title: siteConfig.name,
      description: siteConfig.description,
      images,
    },
    twitter: { card: "summary_large_image", images: images?.map((i) => i.url) },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

/** 게시물 상세 페이지 metadata. */
export function postMetadata(post: Post): Metadata {
  const url = `/posts/${post.slug}`;
  const description = post.excerpt || siteConfig.description;
  const images = post.coverImage
    ? [{ url: abs(post.coverImage.src), width: post.coverImage.width, height: post.coverImage.height, alt: post.coverImage.alt }]
    : undefined;

  return {
    title: post.title,
    description,
    keywords: post.hashtags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      publishedTime: post.timestamp,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
