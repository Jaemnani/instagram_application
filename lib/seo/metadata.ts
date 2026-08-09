import type { Metadata } from "next";

import { siteConfig } from "@/lib/config";
import { brandCopy, targetKeywords } from "@/lib/content";
import type { Post, Profile } from "@/lib/instagram/types";
import { abs } from "@/lib/seo/jsonld";

/**
 * 홈 <title> — 브랜드명만 넣으면 브랜드를 이미 아는 사람만 찾을 수 있다.
 * 지역 + 업종 + 대표 서비스를 함께 담아 검색 노출을 만든다.
 */
const homeTitle = `${brandCopy.heading} ${siteConfig.name} | ${brandCopy.headingAccent}`;

/** 하위 페이지 접미사. 페이지 고유 제목 뒤에 브랜드·업종을 붙인다. */
const titleTemplate = `%s | ${siteConfig.name} 성수동 베이비스튜디오`;

/** 기본 og:image — 전용 1200×630 (app/opengraph-image.tsx) 가 자동 적용된다. */
function profileImage(profile?: Profile) {
  const pic = profile?.profilePicture;
  if (!pic || pic.src.endsWith(".svg")) return undefined;
  return [{ url: abs(pic.src), width: pic.width, height: pic.height, alt: pic.alt }];
}

/** layout 공통 metadata (template, OG 기본값, robots, 사이트 소유확인). */
export function baseMetadata(profile?: Profile): Metadata {
  const verification: Metadata["verification"] = {};
  if (siteConfig.verification.google) verification.google = siteConfig.verification.google;
  // 네이버 서치어드바이저는 표준 필드가 없어 other 로 넣는다.
  if (siteConfig.verification.naver) {
    verification.other = { "naver-site-verification": siteConfig.verification.naver };
  }

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: homeTitle, template: titleTemplate },
    description: siteConfig.description,
    keywords: [...targetKeywords],
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url: siteConfig.url,
      title: homeTitle,
      description: siteConfig.description,
      images: profileImage(profile),
    },
    twitter: { card: "summary_large_image", title: homeTitle, description: siteConfig.description },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    ...(Object.keys(verification).length && { verification }),
  };
}

/** 게시물 상세 페이지 metadata. */
export function postMetadata(post: Post): Metadata {
  const url = `/posts/${post.slug}`;
  const description = post.excerpt || siteConfig.description;
  const images = post.coverImage
    ? [
        {
          url: abs(post.coverImage.src),
          width: post.coverImage.width,
          height: post.coverImage.height,
          alt: post.coverImage.alt,
        },
      ]
    : undefined;

  return {
    title: post.title,
    description,
    // 게시물 해시태그에 지역·업종 키워드를 더해 주제를 분명히 한다.
    keywords: [...new Set([...post.hashtags, ...targetKeywords.slice(0, 3)])],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
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
