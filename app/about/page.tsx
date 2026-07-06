import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { hasLocalBusinessData, instagramUrl, siteConfig } from "@/lib/config";
import { getInstagramData } from "@/lib/data";
import { breadcrumbLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "소개",
  description: `${siteConfig.name} 소개 — 위치, 영업시간, 연락처 안내.`,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { profile } = await getInstagramData();
  const b = siteConfig.business;
  const fullAddress = [b.streetAddress, b.addressLocality, b.addressRegion, b.postalCode]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-2xl">
      <JsonLd
        data={breadcrumbLd([
          { name: "홈", path: "/" },
          { name: "소개", path: "/about" },
        ])}
      />

      <h1 className="text-2xl font-bold tracking-tight">{siteConfig.name} 소개</h1>

      {profile.biography && (
        <p className="mt-4 whitespace-pre-line leading-relaxed text-neutral-700">
          {profile.biography}
        </p>
      )}

      {hasLocalBusinessData() && (
        <section className="mt-8" aria-labelledby="info-heading">
          <h2 id="info-heading" className="text-lg font-semibold">매장 정보</h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {fullAddress && (
              <>
                <dt className="font-medium text-neutral-500">주소</dt>
                <dd className="text-neutral-800">{fullAddress}</dd>
              </>
            )}
            {b.telephone && (
              <>
                <dt className="font-medium text-neutral-500">전화</dt>
                <dd className="text-neutral-800">
                  <a href={`tel:${b.telephone}`} className="hover:underline">{b.telephone}</a>
                </dd>
              </>
            )}
            {b.openingHours && (
              <>
                <dt className="font-medium text-neutral-500">영업시간</dt>
                <dd className="text-neutral-800">{b.openingHours}</dd>
              </>
            )}
            {b.latitude && b.longitude && (
              <>
                <dt className="font-medium text-neutral-500">지도</dt>
                <dd>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:underline"
                  >
                    지도에서 보기 →
                  </a>
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">팔로우하기</h2>
        <a
          href={instagramUrl(profile.username || siteConfig.instagramHandle)}
          target="_blank"
          rel="noopener noreferrer me"
          className="mt-2 inline-block text-rose-600 hover:underline"
        >
          Instagram @{profile.username || siteConfig.instagramHandle}
        </a>
      </section>
    </div>
  );
}
