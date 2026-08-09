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

/**
 * Accept-Language 헤더에서 지원 언어를 고른다.
 * zh-TW/zh-HK 도 간체 페이지로 보내는 편이 빈 화면보다 낫다.
 */
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

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
  return defaultLocale;
}
