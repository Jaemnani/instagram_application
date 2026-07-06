import { hasLocalBusinessData, instagramUrl, siteConfig } from "@/lib/config";
import type { Post, Profile } from "@/lib/instagram/types";

/** 절대 URL 생성 */
export function abs(pathname: string): string {
  if (/^https?:\/\//.test(pathname)) return pathname;
  return `${siteConfig.url}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

type Json = Record<string, unknown>;

/** Organization / WebSite — 모든 페이지 공통 (브랜드 엔티티: GEO 핵심) */
export function organizationLd(profile: Profile): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    ...(profile.profilePicture && { logo: abs(profile.profilePicture.src) }),
    ...(profile.biography && { description: profile.biography }),
    sameAs: [instagramUrl(profile.username || siteConfig.instagramHandle)],
  };
}

export function webSiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: siteConfig.locale.replace("_", "-"),
  };
}

/** LocalBusiness — 지역(Geographic) SEO. NAP + geo 좌표 + 영업시간. */
export function localBusinessLd(profile: Profile): Json | null {
  if (!hasLocalBusinessData()) return null;
  const b = siteConfig.business;

  const address: Json = { "@type": "PostalAddress", addressCountry: b.addressCountry };
  if (b.streetAddress) address.streetAddress = b.streetAddress;
  if (b.addressLocality) address.addressLocality = b.addressLocality;
  if (b.addressRegion) address.addressRegion = b.addressRegion;
  if (b.postalCode) address.postalCode = b.postalCode;

  const ld: Json = {
    "@context": "https://schema.org",
    "@type": siteConfig.businessType,
    "@id": `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    url: siteConfig.url,
    image: profile.profilePicture ? abs(profile.profilePicture.src) : undefined,
    description: profile.biography || siteConfig.description,
    address,
    sameAs: [instagramUrl(profile.username || siteConfig.instagramHandle)],
  };

  if (b.latitude && b.longitude) {
    ld.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
    };
  }
  if (b.telephone) ld.telephone = b.telephone;
  if (b.priceRange) ld.priceRange = b.priceRange;
  if (b.openingHours) {
    ld.openingHours = b.openingHours.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ld;
}

/** 게시물 상세 — SocialMediaPosting + 대표 ImageObject + 공개 참여지표/댓글 */
export function postLd(post: Post): Json {
  const images = post.images.map((im) => abs(im.src));

  const interaction: Json[] = [];
  if (post.likeCount !== undefined) {
    interaction.push({
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: post.likeCount,
    });
  }
  if (post.commentsCount !== undefined) {
    interaction.push({
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: post.commentsCount,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    "@id": `${siteConfig.url}/posts/${post.slug}#post`,
    headline: post.title,
    articleBody: post.caption,
    datePublished: post.timestamp,
    url: `${siteConfig.url}/posts/${post.slug}`,
    mainEntityOfPage: `${siteConfig.url}/posts/${post.slug}`,
    inLanguage: siteConfig.locale.replace("_", "-"),
    sameAs: post.permalink,
    keywords: post.hashtags.join(", "),
    author: { "@id": `${siteConfig.url}/#organization` },
    publisher: { "@id": `${siteConfig.url}/#organization` },
    ...(images.length && { image: images }),
    ...(interaction.length && { interactionStatistic: interaction }),
    ...(post.commentsCount !== undefined && { commentCount: post.commentsCount }),
    ...(post.comments.length && {
      comment: post.comments.map((c) => ({
        "@type": "Comment",
        text: c.text,
        ...(c.timestamp && { datePublished: c.timestamp }),
        author: { "@type": "Person", name: c.author },
        ...(c.likeCount !== undefined && {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/LikeAction",
            userInteractionCount: c.likeCount,
          },
        }),
      })),
    }),
  };
}

/** 단일 이미지 ImageObject (이미지 SEO) */
export function imageObjectLd(post: Post): Json | null {
  const cover = post.coverImage;
  if (!cover) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: abs(cover.src),
    ...(cover.width && { width: cover.width }),
    ...(cover.height && { height: cover.height }),
    caption: cover.alt,
    uploadDate: post.timestamp,
  };
}

/** 홈 — ImageGallery (게시물 이미지 모음) */
export function imageGalleryLd(posts: Post[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: `${siteConfig.name} 갤러리`,
    url: siteConfig.url,
    associatedMedia: posts
      .filter((p) => p.coverImage)
      .map((p) => ({
        "@type": "ImageObject",
        contentUrl: abs(p.coverImage!.src),
        caption: p.coverImage!.alt,
        uploadDate: p.timestamp,
      })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: abs(it.path),
    })),
  };
}

/** XSS 방지를 위해 `<`를 이스케이프하여 JSON-LD 문자열 생성. */
export function serializeLd(ld: Json | Json[]): string {
  return JSON.stringify(ld).replace(/</g, "\\u003c");
}
