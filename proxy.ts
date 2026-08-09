import { NextResponse, type NextRequest } from "next/server";

import { isLocale, matchLocale } from "@/lib/i18n/config";

/**
 * 언어 접두사가 없는 요청을 브라우저 언어에 맞는 /{locale}/... 로 보낸다.
 * (Next 16 에서 middleware 규약은 proxy 로 이름이 바뀌었다.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const first = pathname.split("/")[1];
  if (isLocale(first)) return;

  const locale = matchLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  // 브라우저 언어로 고른 결과라 영구 캐시하면 안 된다 (307).
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * 아래는 언어 접두사를 붙이지 않는다:
     * - _next 내부 자원, 파일 확장자가 있는 정적 파일(이미지·폰트)
     * - api, 그리고 언어와 무관한 최상위 규약 파일들
     */
    "/((?!_next|api|fonts|media|robots\\.txt|sitemap\\.xml|llms\\.txt|opengraph-image|favicon\\.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
