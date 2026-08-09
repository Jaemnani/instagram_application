import type { Metadata } from "next";

import { siteConfig } from "@/lib/config";
import {
  getDictionary,
  htmlLang,
  localizedPath,
  locales,
  ogLocale,
  type Locale,
} from "@/lib/i18n";
import type { Post, Profile } from "@/lib/instagram/types";
import { abs } from "@/lib/seo/jsonld";

/**
 * 같은 문서의 각 언어 주소 (hreflang).
 * x-default 는 기본 언어를 가리켜 언어를 특정할 수 없는 크롤러에 기준을 준다.
 */
export function languageAlternates(path = "/"): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of locales) map[htmlLang[l]] = localizedPath(l, path);
  map["x-default"] = localizedPath("ko", path);
  return map;
}

/** 브랜드명은 번역하지 않고, 그 언어의 검색어 한 줄을 붙인다. */
function homeTitle(locale: Locale): string {
  const d = getDictionary(locale);
  return `${d.meta.siteTagline} | ${siteConfig.name}`;
}

function profileImage(profile?: Profile) {
  const pic = profile?.profilePicture;
  if (!pic || pic.src.endsWith(".svg")) return undefined;
  return [{ url: abs(pic.src), width: pic.width, height: pic.height, alt: pic.alt }];
}

/** layout 공통 metadata (template, OG 기본값, robots, hreflang, 사이트 소유확인). */
export function baseMetadata(locale: Locale, profile?: Profile): Metadata {
  const d = getDictionary(locale);

  const verification: Metadata["verification"] = {};
  if (siteConfig.verification.google) verification.google = siteConfig.verification.google;
  // 네이버 서치어드바이저는 표준 필드가 없어 other 로 넣는다.
  if (siteConfig.verification.naver) {
    verification.other = { "naver-site-verification": siteConfig.verification.naver };
  }

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: homeTitle(locale),
      template: `%s | ${siteConfig.name} ${d.meta.titleSuffix}`,
    },
    description: d.meta.description,
    keywords: [...d.meta.keywords],
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    alternates: {
      canonical: localizedPath(locale),
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      url: localizedPath(locale),
      title: homeTitle(locale),
      description: d.meta.description,
      images: profileImage(profile),
    },
    twitter: {
      card: "summary_large_image",
      title: homeTitle(locale),
      description: d.meta.description,
    },
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

/** 게시물 상세 페이지 metadata. 번역이 있으면 그 언어 제목·요약을 쓴다. */
export function postMetadata(locale: Locale, post: Post): Metadata {
  const d = getDictionary(locale);
  const path = `/posts/${post.slug}`;
  const url = localizedPath(locale, path);

  const t = post.translations?.[locale];
  const title = t?.title || post.title;
  const description = t?.excerpt || post.excerpt || d.meta.description;

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
    title,
    description,
    keywords: [...new Set([...post.hashtags, ...d.meta.keywords.slice(0, 3)])],
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "article",
      url,
      siteName: siteConfig.name,
      locale: ogLocale[locale],
      title,
      description,
      publishedTime: post.timestamp,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
