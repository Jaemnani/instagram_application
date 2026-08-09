import Link from "next/link";

import { instagramUrl, siteConfig } from "@/lib/config";
import type { Profile } from "@/lib/instagram/types";

export function SiteFooter({ profile }: { profile: Profile }) {
  const b = siteConfig.business;
  const address = [b.addressRegion, b.addressLocality, b.streetAddress].filter(Boolean).join(" ");
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <footer className="border-t border-ivory-200 bg-ivory-100">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="font-serif text-xl font-bold text-ink-900">{siteConfig.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink-400">
              스튜디오
            </h2>
            <address className="mt-3 space-y-1 text-sm not-italic text-ink-600">
              {address && <p>{address}</p>}
              {b.telephone && (
                <p>
                  <a href={`tel:${b.telephone}`} className="hover:text-ink-900">
                    {b.telephone}
                  </a>
                </p>
              )}
              <p>월–금 10:00–19:00 · 토·일 10:00–18:00</p>
            </address>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink-400">바로가기</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-600">
              <li>
                <Link href="/about" className="hover:text-ink-900">
                  스튜디오 소개
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ink-900">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <a
                  href={instagramUrl(profile.username || siteConfig.instagramHandle)}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="hover:text-ink-900"
                >
                  Instagram @{profile.username || siteConfig.instagramHandle}
                </a>
              </li>
              {bookingUrl && (
                <li>
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-ink-900"
                  >
                    카카오톡 예약 문의
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-ivory-200 pt-6 text-xs text-ink-400">
          © {siteConfig.name}. 게시물은 공식 인스타그램에서 자동 동기화됩니다.
        </p>
      </div>
    </footer>
  );
}
