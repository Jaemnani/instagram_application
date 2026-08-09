import { intlLocale, type Locale } from "@/lib/i18n/config";

/** ISO 타임스탬프 → 해당 언어의 날짜 문자열. 잘못된 값은 빈 문자열. */
export function formatDate(iso: string, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(intlLocale[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 좋아요 수 등 숫자 표기 */
export function formatNumber(n: number, locale: Locale): string {
  return n.toLocaleString(intlLocale[locale]);
}
