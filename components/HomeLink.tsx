import Link from "next/link";

import { siteConfig } from "@/lib/config";

/**
 * 하위 페이지 상단의 홈 링크.
 * 상단 바도 브레드크럼 텍스트도 없이, 워드마크 로고 자체가 홈으로 가는 링크가 된다.
 */
export function HomeLink() {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} 홈으로`}
      className="wordmark inline-block text-base text-ink-900 transition-colors hover:text-clay-600 sm:text-lg"
    >
      {siteConfig.name}
    </Link>
  );
}
