import Link from "next/link";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { instagramUrl, siteConfig } from "@/lib/config";
import { localizedPath, type Dictionary, type Locale } from "@/lib/i18n";
import type { Profile } from "@/lib/instagram/types";

export function SiteFooter({
  lang,
  dict,
  profile,
}: {
  lang: Locale;
  dict: Dictionary;
  profile: Profile;
}) {
  const b = siteConfig.business;
  // 주소는 번역하지 않는다 — 지도·내비게이션에 그대로 쓸 수 있어야 한다.
  const address = [b.addressRegion, b.addressLocality, b.streetAddress].filter(Boolean).join(" ");
  const bookingUrl = siteConfig.bookingUrl || profile.website;

  return (
    <footer className="snap-tail border-t border-ivory-200 bg-ivory-100">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="wordmark text-lg text-ink-900">{siteConfig.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600">
              {dict.meta.description}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink-600">
              {dict.footer.studio}
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
              <p>{dict.location.hoursShort}</p>
            </address>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink-600">
              {dict.footer.links}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-600">
              <li>
                <Link href={`${localizedPath(lang)}#story`} className="hover:text-ink-900">
                  {dict.footer.about}
                </Link>
              </li>
              <li>
                <Link href={localizedPath(lang, "/privacy")} className="hover:text-ink-900">
                  {dict.footer.privacy}
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
                    {dict.footer.kakao}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <LanguageSwitcher lang={lang} dict={dict} />
        </div>

        <p className="mt-12 border-t border-ivory-200 pt-6 text-xs text-ink-600">
          © {siteConfig.name}. {dict.footer.syncNote}
        </p>
      </div>
    </footer>
  );
}
