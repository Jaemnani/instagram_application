import type { Metadata } from "next";
import Link from "next/link";

import { getDictionary, defaultLocale, localizedPath } from "@/lib/i18n";

export const metadata: Metadata = { robots: { index: false } };

/**
 * 언어 세그먼트 안의 not-found. params 를 받을 수 없어 기본 언어로 표시한다
 * (잘못된 주소이므로 언어 정확도보다 빠른 복귀 경로가 중요하다).
 */
export default function NotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-clay-500">404</p>
      <h1 className="mt-4 font-serif text-3xl font-bold text-ink-900">{dict.notFound.title}</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{dict.notFound.body}</p>
      <div className="mt-8">
        <Link
          href={localizedPath(defaultLocale)}
          className="inline-block rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
        >
          {dict.notFound.home}
        </Link>
      </div>
    </div>
  );
}
