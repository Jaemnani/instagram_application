import { hasLocalBusinessData, siteConfig } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";

/** 위치·교통·편의시설 — 지역(Geographic) SEO 본문. LocalBusiness JSON-LD 와 짝을 이룬다. */
export function LocationCard({ dict }: { dict: Dictionary }) {
  if (!hasLocalBusinessData()) return null;
  const b = siteConfig.business;
  const t = dict.location;

  // 주소는 번역하지 않는다 — 지도·내비게이션에 그대로 넣을 수 있어야 한다.
  const fullAddress = [b.addressRegion, b.addressLocality, b.streetAddress]
    .filter(Boolean)
    .join(" ");
  const mapQuery = b.latitude && b.longitude ? `${b.latitude},${b.longitude}` : fullAddress;

  return (
    <div className="mt-10 grid gap-10 sm:grid-cols-2">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink-900">{t.address}</h3>
        <address className="mt-2 not-italic leading-relaxed text-ink-600">
          {fullAddress}
          {b.postalCode && (
            <span className="block text-sm text-ink-400">{t.postalCode(b.postalCode)}</span>
          )}
        </address>

        {b.openingHours && (
          <>
            <h3 className="mt-7 font-serif text-lg font-semibold text-ink-900">{t.hours}</h3>
            <ul className="mt-2 space-y-1 text-ink-600">
              <li>{t.hoursWeekday}</li>
              <li>{t.hoursWeekend}</li>
            </ul>
          </>
        )}

        {b.telephone && (
          <>
            <h3 className="mt-7 font-serif text-lg font-semibold text-ink-900">{t.phone}</h3>
            <p className="mt-2">
              <a href={`tel:${b.telephone}`} className="text-clay-600 hover:underline">
                {b.telephone}
              </a>
            </p>
          </>
        )}
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold text-ink-900">{t.directions}</h3>
        <ul className="mt-2 space-y-2 text-ink-600">
          {t.directionsItems.map((d) => (
            <li key={d} className="flex gap-2">
              <span aria-hidden="true" className="text-clay-500">
                —
              </span>
              <span>{d}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-7 font-serif text-lg font-semibold text-ink-900">{t.amenities}</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {t.amenityItems.map((a) => (
            <li
              key={a}
              className="rounded-full border border-ivory-300 px-3 py-1 text-sm text-ink-600"
            >
              {a}
            </li>
          ))}
        </ul>

        <p className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
          <a
            href={`https://map.naver.com/p/search/${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-clay-600 hover:underline"
          >
            {dict.ui.naverMap}
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-clay-600 hover:underline"
          >
            {dict.ui.googleMap}
          </a>
        </p>
      </div>
    </div>
  );
}
