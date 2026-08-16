import { NextResponse, type NextRequest } from "next/server";

import { isLocale, LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/config";

/**
 * 언어 접두사가 없는 요청을 사용자에게 맞는 /{locale}/... 로 보낸다.
 * 우선순위: 직접 선택(쿠키) → 브라우저 언어 → 접속 국가(IP, Vercel 헤더) → 한국어.
 * (Next 16 에서 middleware 규약은 proxy 로 이름이 바뀌었다.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const first = pathname.split("/")[1];
  if (isLocale(first)) return;

  const locale = resolveLocale({
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    // Vercel 엣지 네트워크가 채워주는 접속 국가 코드. 로컬 개발엔 없어 다음 신호로 넘어간다.
    country: request.headers.get("x-vercel-ip-country"),
  });
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  // 자동 감지 결과라 영구 캐시하면 안 된다 (307). 사용자가 직접 고른 값은 쿠키가 있을 때만
  // 반영되고, 여기서 새로 쿠키를 심지는 않는다 — 자동 감지는 매번 다시 평가될 여지를 남긴다.
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
