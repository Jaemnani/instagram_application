import { siteConfig } from "@/lib/config";
import type { Profile } from "@/lib/instagram/types";

/**
 * 예약·문의 버튼이 가는 곳을 한 곳에서 정한다.
 *
 * - 예약하기: 네이버 예약(NAVER_BOOKING_URL) → 없으면 문의 링크
 * - 문의하기: 카카오톡 채널 등(BOOKING_URL) → 없으면 인스타 프로필의 웹사이트
 *
 * ⚠️ 인스타 프로필 웹사이트가 이 홈페이지 자신(kidding.kr)이면 쓰지 않는다.
 *    실제로 프로필 링크를 홈페이지로 바꾼 뒤 "예약하기"가 홈페이지 첫 화면으로 돌아오는
 *    순환 링크가 됐다(2026-10-12). 엉뚱한 곳으로 보내느니 버튼을 숨긴다.
 */
function isOwnSite(url: string): boolean {
  try {
    const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
    return host(url) === host(siteConfig.url);
  } catch {
    return false;
  }
}

/** 링크가 어디서 왔는지 — 화면·llms.txt 에서 "네이버 예약"인지 "카카오톡"인지 정확히 적기 위해 */
export type LinkSource = "naver" | "kakao" | "profile" | "none";

export function inquiryLinkInfo(profile: Pick<Profile, "website">): { url: string; source: LinkSource } {
  // BOOKING_URL 은 카카오톡 채널 문의 링크로 쓰기로 했다(.env.example)
  if (siteConfig.bookingUrl) return { url: siteConfig.bookingUrl, source: "kakao" };
  const site = profile.website?.trim();
  return site && !isOwnSite(site) ? { url: site, source: "profile" } : { url: "", source: "none" };
}

export function bookingLinkInfo(profile: Pick<Profile, "website">): { url: string; source: LinkSource } {
  if (siteConfig.naverBookingUrl) return { url: siteConfig.naverBookingUrl, source: "naver" };
  return inquiryLinkInfo(profile);
}

export function inquiryLink(profile: Pick<Profile, "website">): string {
  return inquiryLinkInfo(profile).url;
}

export function bookingLink(profile: Pick<Profile, "website">): string {
  return bookingLinkInfo(profile).url;
}

/**
 * FAQ 답변 — 네이버 예약이 켜져 있으면 예약 안내 문항은 네이버용 답(aNaver)을 쓴다.
 * 버튼은 네이버로 가는데 FAQ 는 "카카오톡으로 예약"이라 하면 손님과 AI 모두 헷갈린다(Codex P2).
 * 화면(Faq)과 검색엔진용 FAQPage JSON-LD 가 같은 함수를 써서 어긋나지 않게 한다.
 */
export function faqAnswer(item: { a: string; aNaver?: string }): string {
  return siteConfig.naverBookingUrl && item.aNaver ? item.aNaver : item.a;
}
