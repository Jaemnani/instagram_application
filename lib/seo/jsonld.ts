import { hasLocalBusinessData, instagramUrl, siteConfig } from "@/lib/config";
import { amenities, faqs, services } from "@/lib/content";
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
    // 한국어 상호를 함께 선언해야 "키딩성수" 검색에서도 같은 업체로 인식된다.
    ...(siteConfig.nameKo && { alternateName: siteConfig.nameKo }),
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

const DAY_NAMES: Record<string, string> = {
  Mo: "Monday",
  Tu: "Tuesday",
  We: "Wednesday",
  Th: "Thursday",
  Fr: "Friday",
  Sa: "Saturday",
  Su: "Sunday",
};
const DAY_ORDER = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * "Mo-Fr 10:00-19:00" 형식을 OpeningHoursSpecification 으로 변환.
 * 구글은 문자열 openingHours 보다 이 구조화 형식을 정확히 해석한다.
 * 해석에 실패한 항목은 조용히 버리지 않고 null 로 표시해 호출부가 문자열 폴백을 쓰게 한다.
 */
function parseOpeningHours(spec: string): Json[] | null {
  const out: Json[] = [];
  for (const raw of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = /^([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(raw);
    if (!m) return null;
    const [, from, to, opens, closes] = m;
    const start = DAY_ORDER.indexOf(from);
    if (start < 0) return null;
    const end = to ? DAY_ORDER.indexOf(to) : start;
    if (end < 0 || end < start) return null;

    out.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_ORDER.slice(start, end + 1).map((d) => DAY_NAMES[d]),
      opens,
      closes,
    });
  }
  return out.length ? out : null;
}

/**
 * LocalBusiness — 지역(Geographic) SEO. NAP + geo 좌표 + 영업시간 + 서비스 카탈로그.
 * businessType 은 schema.org LocalBusiness 하위 타입(사진 전용 타입은 없어 ProfessionalService 권장).
 */
export function localBusinessLd(profile: Profile): Json | null {
  if (!hasLocalBusinessData()) return null;
  const b = siteConfig.business;

  const address: Json = { "@type": "PostalAddress", addressCountry: b.addressCountry };
  if (b.streetAddress) address.streetAddress = b.streetAddress;
  if (b.addressLocality) address.addressLocality = b.addressLocality;
  if (b.addressRegion) address.addressRegion = b.addressRegion;
  if (b.postalCode) address.postalCode = b.postalCode;

  const sameAs = [instagramUrl(profile.username || siteConfig.instagramHandle)];
  const booking = siteConfig.bookingUrl || profile.website;
  if (booking) sameAs.push(booking);

  const ld: Json = {
    "@context": "https://schema.org",
    "@type": siteConfig.businessType,
    "@id": `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    ...(siteConfig.nameKo && { alternateName: siteConfig.nameKo }),
    url: siteConfig.url,
    image: profile.profilePicture ? abs(profile.profilePicture.src) : undefined,
    description: profile.biography || siteConfig.description,
    address,
    sameAs,
    knowsLanguage: "ko",
    ...(siteConfig.areaServed.length && {
      areaServed: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
    }),
    amenityFeature: amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    hasOfferCatalog: { "@id": `${siteConfig.url}/#services` },
  };

  if (b.latitude && b.longitude) {
    ld.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(b.latitude),
      longitude: Number(b.longitude),
    };
    ld.hasMap = `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`;
  }
  if (booking) ld.potentialAction = { "@type": "ReserveAction", target: booking };
  if (b.telephone) ld.telephone = b.telephone;
  if (b.priceRange) ld.priceRange = b.priceRange;
  if (b.openingHours) {
    const structured = parseOpeningHours(b.openingHours);
    if (structured) ld.openingHoursSpecification = structured;
    else ld.openingHours = b.openingHours.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ld;
}

/** 서비스 카탈로그 — "돌사진", "가족사진" 등 제공 항목을 구조화 (GEO 인용 근거). */
export function offerCatalogLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${siteConfig.url}/#services`,
    name: `${siteConfig.name} 촬영 서비스`,
    itemListElement: services.map((s, i) => ({
      "@type": "Offer",
      position: i + 1,
      itemOffered: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        serviceType: s.name,
        provider: { "@id": `${siteConfig.url}/#localbusiness` },
        ...(siteConfig.areaServed.length && {
          areaServed: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
        }),
      },
    })),
  };
}

/** FAQPage — AI 생성형 엔진이 질문·답변 쌍을 그대로 인용하기 가장 좋은 형식. */
export function faqPageLd(): Json | null {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteConfig.url}/#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
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
