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

  /** 비즈니스/사이트 표시명 */
  name: env("SITE_NAME", "Your Business"),

  /** 사이트 한 줄 설명 (메타 description 기본값) */
  description: env(
    "SITE_DESCRIPTION",
    "인스타그램 콘텐츠를 SEO/GEO에 최적화하여 제공하는 공식 홈페이지.",
  ),

  /** 기본 로케일 (html lang) */
  locale: env("SITE_LOCALE", "ko_KR"),

  /** 예약/문의 링크. 미설정 시 인스타 프로필의 website(카카오 채널 등)를 쓴다. */
  bookingUrl: env("BOOKING_URL"),

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

/** LocalBusiness JSON-LD를 출력할 만큼 주소/좌표 정보가 충분한지 */
export function hasLocalBusinessData(): boolean {
  const b = siteConfig.business;
  return Boolean(b.streetAddress && b.addressLocality) || Boolean(b.latitude && b.longitude);
}
