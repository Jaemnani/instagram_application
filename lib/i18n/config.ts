/** 지원 언어. 첫 번째가 기본값이며, URL 은 항상 /{locale}/... 형태를 갖는다. */
export const locales = ["ko", "en", "ja", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** 언어 선택 UI 에 그 언어로 표기 (자기 언어 이름이 가장 알아보기 쉽다) */
export const localeLabels: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "简体中文",
};

/** <html lang> 및 hreflang 값 */
export const htmlLang: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en",
  ja: "ja",
  zh: "zh-Hans",
};

/** og:locale 값 */
export const ogLocale: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
  zh: "zh_CN",
};

/** 날짜 표기에 쓰는 Intl 로케일 */
export const intlLocale: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
};

/** /ko/posts/x → /en/posts/x 처럼 같은 문서의 다른 언어 주소 */
export function localizedPath(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/** 언어를 직접 고르면 심는 쿠키. 자동 감지 결과는 여기 저장하지 않는다(재평가 여지를 남긴다). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Accept-Language 헤더에서 지원 언어를 고른다.
 * zh-TW/zh-HK 도 간체 페이지로 보내는 편이 빈 화면보다 낫다.
 * 매치가 없으면 null — 호출자가 다음 신호(접속 국가)로 넘어간다.
 */
export function matchAcceptLanguage(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) || 0 : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/**
 * 호스팅(Vercel)이 엣지에서 붙여주는 접속 국가 코드(ISO 3166-1 alpha-2)로 언어를 추정.
 * 로컬 개발 환경에는 이 헤더가 없어 null 을 돌려주고, 그러면 다음 신호로 자연히 넘어간다.
 */
export function matchCountry(country: string | null): Locale | null {
  if (!country) return null;
  const code = country.toUpperCase();
  if (code === "KR") return "ko";
  if (code === "JP") return "ja";
  if (code === "CN" || code === "TW" || code === "HK" || code === "MO") return "zh";
  if (code === "US" || code === "GB" || code === "CA" || code === "AU" || code === "NZ" || code === "IE")
    return "en";
  return null;
}

/**
 * 언어 감지 우선순위: 사용자가 직접 고른 값(쿠키) → 브라우저 언어 설정
 * → 접속 국가(IP) → 기본값(한국어). 어떤 신호도 지원 언어와 안 맞으면 한국어를 보여준다.
 */
export function resolveLocale({
  cookieLocale,
  acceptLanguage,
  country,
}: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  country?: string | null;
}): Locale {
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;
  return (
    matchAcceptLanguage(acceptLanguage ?? null) ?? matchCountry(country ?? null) ?? defaultLocale
  );
}
