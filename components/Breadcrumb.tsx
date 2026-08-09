import Link from "next/link";

import { siteConfig } from "@/lib/config";

/**
 * 하위 페이지 상단 이동 경로.
 * 상단 고정 헤더를 없앴으므로 첫 항목을 워드마크로 두어 브랜드 표시와 홈 링크를 겸한다
 * (바 없이 같은 역할을 한다).
 */
export function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="탐색 경로" className="flex items-baseline gap-3 text-sm">
      <Link
        href="/"
        className="wordmark text-sm text-ink-900 transition-colors hover:text-clay-600"
      >
        {siteConfig.name}
      </Link>
      <span aria-hidden="true" className="text-ivory-300">
        /
      </span>
      <span className="text-ink-400">{current}</span>
    </nav>
  );
}
