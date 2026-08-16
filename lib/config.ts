/**
 * 사이트 + 비즈니스 설정.
 * 값은 환경변수로 주입하고, 미설정 시 데모용 기본값을 사용한다.
 * LocalBusiness(지역 SEO) JSON-LD와 메타데이터가 이 값을 참조한다.
 */

function env(key: string, fallback = ""): string {
  return process.env[key]?.trim() || fallback;
}

if (process.env.NODE_ENV === "production" && !process.env.SITE_URL?.trim()) {
  console.warn(
    "⚠ SITE_URL 이 설정되지 않아 canonical/sitemap/OG URL이 localhost로 생성됩니다.",
  );
}

export const siteConfig = {
  /** 배포 URL (canonical, sitemap, OG 등에 사용). 끝 슬래시 없이. */
  url: env("SITE_URL", "http://localhost:3000").replace(/\/$/, ""),

  /** 인스타그램 핸들 (@ 제외) */
  instagramHandle: env("IG_USERNAME", "your_business"),

  /** 비즈니스/사이트 표시명 (화면에 보이는 이름) */
  name: env("SITE_NAME", "Your Business"),

  /**
   * 한국어 표기. 화면은 영문을 쓰더라도 구조화 데이터의 alternateName 과
   * 본문 첫 언급에 남겨 한국어 브랜드 검색 신호를 유지한다.
   */
  nameKo: env("SITE_NAME_KO"),

  /** 사이트 한 줄 설명 (메타 description 기본값) */
  description: env(
    "SITE_DESCRIPTION",
    "인스타그램 콘텐츠를 SEO/GEO에 최적화하여 제공하는 공식 홈페이지.",
  ),

  /** 기본 로케일 (html lang) */
  locale: env("SITE_LOCALE", "ko_KR"),

  /** 예약/문의 링크. 미설정 시 인스타 프로필의 website(카카오 채널 등)를 쓴다. */
  bookingUrl: env("BOOKING_URL"),

  /** 히어로 배경으로 쓸 게시물 id. 미설정 시 좋아요가 가장 많은 게시물의 사진. */
  heroPostId: env("HERO_POST_ID"),

  /**
   * 히어로 배경을 특정 게시물이 아니라 직접 지정한 정적 이미지로 고정한다.
   * 설정되면 heroPostId/좋아요 최다 게시물 로직보다 우선한다.
   * `public/hero/` 아래 둔다 — `public/media/` 는 npm run sync 가 게시물에서
   * 참조 안 되는 파일을 자동 삭제하므로(pruneOrphanMedia) 수동 파일을 두면 안 된다.
   */
  heroImageSrc: env("HERO_IMAGE_SRC"),

  /** 지역 SEO: 주요 서비스 지역 (schema.org areaServed) */
  areaServed: env("BIZ_AREA_SERVED", "서울 성동구,성수동,서울숲,서울특별시")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  /** 검색엔진 사이트 소유확인 (구글 서치콘솔 / 네이버 서치어드바이저) */
  verification: {
    google: env("GOOGLE_SITE_VERIFICATION"),
    naver: env("NAVER_SITE_VERIFICATION"),
  },

  /** LocalBusiness 스키마 타입 (예: Restaurant, Store, CafeOrCoffeeShop ...) */
  businessType: env("BUSINESS_TYPE", "LocalBusiness"),

  /** 지역(Geographic) SEO 용 NAP + 좌표. 비어 있으면 LocalBusiness 스키마는 생략된다. */
  business: {
    streetAddress: env("BIZ_STREET"),
    addressLocality: env("BIZ_LOCALITY"), // 시/구
    addressRegion: env("BIZ_REGION"), // 도/주
    postalCode: env("BIZ_POSTAL"),
    addressCountry: env("BIZ_COUNTRY", "KR"),
    /**
     * 지도 검색어. 도로명주소가 지도에서 엉뚱한 곳에 잡히면 지번 주소를 여기 넣는다.
     * 비우면 위 주소를 조합해 쓴다.
     */
    mapQuery: env("BIZ_MAP_QUERY"),
    /**
     * 로마자 주소 — 영어 화면에서 "읽을 수 있는" 주소로 보여준다. 일본어·중국어는
     * 아래 addressJa/addressZh 가 있으면 그 언어 표기를 우선 쓰고, 없으면 이 로마자로
     * 대체한다. 한글 주소는 그 아래 지도·택시용으로 항상 함께 남긴다(외국인은 한글을
     * 못 읽지만, 국내 지도 앱과 택시에는 한글 원문이 필요하다).
     * 도로명주소 영문 표기 규칙: 로 → -ro, 길 → -gil, 구 → -gu.
     */
    addressLatin: env("BIZ_ADDRESS_LATIN"),
    /** 일본어 화면용 현지 표기 주소(간지·가타카나). 비어 있으면 로마자로 대체. */
    addressJa: env("BIZ_ADDRESS_JA"),
    /** 중국어 화면용 현지 표기 주소(한자). 비어 있으면 로마자로 대체. */
    addressZh: env("BIZ_ADDRESS_ZH"),
    telephone: env("BIZ_PHONE"),
    /** 위도/경도 (지역 검색 핵심). 숫자 문자열. */
    latitude: env("BIZ_LAT"),
    longitude: env("BIZ_LNG"),
    /** "Mo-Fr 09:00-18:00" 형식 등. 콤마로 여러 개. */
    openingHours: env("BIZ_HOURS"),
    priceRange: env("BIZ_PRICE_RANGE"),
  },
} as const;

export type SiteConfig = typeof siteConfig;

export function instagramUrl(handle = siteConfig.instagramHandle): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}

/** 화면·지도에 그대로 쓸 수 있는 한 줄 주소. 번역하지 않는다. */
export function fullAddress(): string {
  const b = siteConfig.business;
  return [b.addressRegion, b.addressLocality, b.streetAddress].filter(Boolean).join(" ");
}

/**
 * 화면에 보여줄 그 언어 표기 주소. 한국어는 원문 그대로, 그 외 언어는 해당 언어
 * 표기(addressJa/addressZh)가 있으면 그것을, 없으면 로마자(addressLatin)를 쓴다.
 * (일본어·중국어에도 로마자만 보이던 문제 수정 — 두 언어 모두 자기 문자로 된
 * 주소가 있어야 읽고 이해할 수 있다.)
 */
export function localizedAddress(locale: string): string {
  const b = siteConfig.business;
  if (locale === "ko") return fullAddress();
  if (locale === "ja" && b.addressJa) return b.addressJa;
  if (locale === "zh" && b.addressZh) return b.addressZh;
  return b.addressLatin;
}

/**
 * 구글지도 링크.
 *
 * 좌표로 링크하면 좌표의 오차가 그대로 핀 위치가 된다(수십 m 만 틀려도 옆 건물을 가리킨다).
 * 주소 문자열을 넘겨 구글이 건물을 직접 찾게 하고, 주소가 아예 없을 때만 좌표로 떨어진다.
 */
export function googleMapsUrl(): string | null {
  const b = siteConfig.business;
  const query =
    b.mapQuery ||
    fullAddress() ||
    (b.latitude && b.longitude ? `${b.latitude},${b.longitude}` : "");
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}

/** LocalBusiness JSON-LD를 출력할 만큼 주소/좌표 정보가 충분한지 */
export function hasLocalBusinessData(): boolean {
  const b = siteConfig.business;
  return Boolean(b.streetAddress && b.addressLocality) || Boolean(b.latitude && b.longitude);
}
