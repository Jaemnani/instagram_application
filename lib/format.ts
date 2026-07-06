import { siteConfig } from "@/lib/config";

const DATE_LOCALE = siteConfig.locale.replace("_", "-");

/** ISO 타임스탬프 → 사이트 로케일 날짜 문자열. 잘못된 값은 빈 문자열. */
export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(DATE_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
