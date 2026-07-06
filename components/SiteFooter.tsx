import Link from "next/link";

import { instagramUrl, siteConfig } from "@/lib/config";
import type { Profile } from "@/lib/instagram/types";

export function SiteFooter({ profile }: { profile: Profile }) {
  const b = siteConfig.business;
  const address = [b.streetAddress, b.addressLocality].filter(Boolean).join(", ");

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-600">
        <p className="font-semibold text-neutral-900">{siteConfig.name}</p>
        {address && <p className="mt-1">{address}</p>}
        {b.telephone && <p className="mt-1">전화: {b.telephone}</p>}
        {b.openingHours && <p className="mt-1">영업시간: {b.openingHours}</p>}
        <div className="mt-4 flex gap-4">
          <Link href="/about" className="hover:text-neutral-900">소개</Link>
          <a
            href={instagramUrl(profile.username || siteConfig.instagramHandle)}
            target="_blank"
            rel="noopener noreferrer me"
            className="hover:text-neutral-900"
          >
            Instagram @{profile.username || siteConfig.instagramHandle}
          </a>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          © {siteConfig.name}. 콘텐츠는 인스타그램에서 동기화됩니다.
        </p>
      </div>
    </footer>
  );
}
