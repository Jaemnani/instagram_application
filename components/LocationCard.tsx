import { hasLocalBusinessData, siteConfig } from "@/lib/config";
import { amenities, directions } from "@/lib/content";

/** 위치·교통·편의시설 — 지역(Geographic) SEO 본문. LocalBusiness JSON-LD와 짝을 이룬다. */
export function LocationCard() {
  if (!hasLocalBusinessData()) return null;
  const b = siteConfig.business;
  const fullAddress = [b.addressRegion, b.addressLocality, b.streetAddress]
    .filter(Boolean)
    .join(" ");
  const mapQuery = b.latitude && b.longitude ? `${b.latitude},${b.longitude}` : fullAddress;

  return (
    <div className="mt-10 grid gap-10 sm:grid-cols-2">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink-900">주소</h3>
        <address className="mt-2 not-italic leading-relaxed text-ink-600">
          {fullAddress}
          {b.postalCode && <span className="block text-sm text-ink-400">우편번호 {b.postalCode}</span>}
        </address>

        {b.openingHours && (
          <>
            <h3 className="mt-7 font-serif text-lg font-semibold text-ink-900">영업시간</h3>
            <ul className="mt-2 space-y-1 text-ink-600">
              <li>월–금 10:00 – 19:00</li>
              <li>토·일 10:00 – 18:00</li>
            </ul>
          </>
        )}

        {b.telephone && (
          <>
            <h3 className="mt-7 font-serif text-lg font-semibold text-ink-900">전화</h3>
            <p className="mt-2">
              <a href={`tel:${b.telephone}`} className="text-clay-600 hover:underline">
                {b.telephone}
              </a>
            </p>
          </>
        )}
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-ink-900">찾아오시는 길</h3>
        <ul className="mt-2 space-y-2 text-ink-600">
          {directions.map((d) => (
            <li key={d} className="flex gap-2">
              <span aria-hidden="true" className="text-clay-500">
                —
              </span>
              <span>{d}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-7 font-serif text-lg font-semibold text-ink-900">편의시설</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {amenities.map((a) => (
            <li
              key={a}
              className="rounded-full border border-ivory-300 px-3 py-1 text-sm text-ink-600"
            >
              {a}
            </li>
          ))}
        </ul>

        <p className="mt-7">
          <a
            href={`https://map.naver.com/p/search/${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-clay-600 hover:underline"
          >
            네이버 지도에서 보기 →
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-5 text-sm font-medium text-clay-600 hover:underline"
          >
            구글 지도에서 보기 →
          </a>
        </p>
      </div>
    </div>
  );
}
