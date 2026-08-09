import Link from "next/link";

import { localeLabels, locales, type Dictionary, type Locale } from "@/lib/i18n";

/**
 * 언어 전환 — 푸터에 텍스트 링크로 둔다.
 * 드롭다운 대신 전부 펼쳐 두면 JS 가 필요 없고, 크롤러가 각 언어 페이지로 가는
 * 실제 링크를 따라갈 수 있어 색인에도 유리하다.
 *
 * `path` 는 현재 페이지의 언어 접두사를 뺀 경로. 게시물 슬러그는 언어별로 같으므로
 * 같은 문서의 다른 언어판으로 바로 이동한다.
 */
export function LanguageSwitcher({
  lang,
  dict,
  path = "/",
}: {
  lang: Locale;
  dict: Dictionary;
  path?: string;
}) {
  return (
    <nav aria-label={dict.ui.language}>
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink-400">
        {dict.ui.language}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {locales.map((l) => {
          const href = `/${l}${path === "/" ? "" : path}`;
          const current = l === lang;
          return (
            <li key={l}>
              {current ? (
                <span aria-current="true" className="text-ink-900">
                  {localeLabels[l]}
                </span>
              ) : (
                <Link href={href} hrefLang={l} className="text-ink-600 hover:text-ink-900">
                  {localeLabels[l]}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
