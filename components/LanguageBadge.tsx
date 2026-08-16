"use client";

import Link from "next/link";

import { LOCALE_COOKIE, locales, type Locale } from "@/lib/i18n/config";

const localeCode: Record<Locale, string> = { ko: "KO", en: "EN", ja: "JA", zh: "ZH" };

/**
 * 히어로 우측 상단의 언어 전환 배지. 히어로 안에만 존재해 스크롤하면 함께 사라진다
 * — 사이트는 헤더 없이 히어로가 화면을 채우는 디자인이라, 상시 노출 헤더를 새로 만들지 않는다.
 *
 * 직접 고른 언어는 쿠키에 1년간 남겨 다음 방문 때도 그대로 존중한다(proxy.ts 가 읽는다).
 * label 은 문자열만 받는다 — 사전 객체를 통째로 넘기면 함수 필드 때문에 Client Component
 * 빌드가 실패한다.
 */
export function LanguageBadge({
  lang,
  label,
  path = "/",
}: {
  lang: Locale;
  label: string;
  path?: string;
}) {
  return (
    <nav
      aria-label={label}
      className="absolute right-5 top-5 z-10 flex items-center gap-0.5 rounded-full bg-ink-900/35 p-1 backdrop-blur-sm sm:right-8 sm:top-8"
    >
      {locales.map((l) => {
        const current = l === lang;
        if (current) {
          return (
            <span
              key={l}
              aria-current="true"
              className="rounded-full bg-ivory-50 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink-900"
            >
              {localeCode[l]}
            </span>
          );
        }
        const href = `/${l}${path === "/" ? "" : path}`;
        return (
          <Link
            key={l}
            href={href}
            hrefLang={l}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
            }}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide text-ivory-200 transition-colors hover:bg-ivory-50/15 hover:text-ivory-50"
          >
            {localeCode[l]}
          </Link>
        );
      })}
    </nav>
  );
}
