import { fullAddress, googleMapsUrl, hasLocalBusinessData, localizedAddress, siteConfig } from "@/lib/config";
import type { Dictionary, Locale } from "@/lib/i18n";

/** 위치·교통·편의시설 — 지역(Geographic) SEO 본문. LocalBusiness JSON-LD 와 짝을 이룬다. */
export function LocationCard({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  if (!hasLocalBusinessData()) return null;
  const b = siteConfig.business;
  const t = dict.location;

  const address = fullAddress();
  const mapUrl = googleMapsUrl();

  /*
   * 한국어 외 화면은 그 언어로 읽을 수 있는 주소(일본어/중국어는 그 문자 표기,
   * 그마저 없으면 로마자)를 먼저 보여준다 — 한글은 외국인에게 완전히 불투명해서
   * 도시조차 알 수 없다. 다만 한글 원문도 같이 남긴다: 국내 지도 앱과 택시에는
   * 그게 필요하고, 다른 표기로는 검색이 안 되는 경우가 많다.
   */
  const shown = lang !== "ko" ? localizedAddress(lang) : "";

  return (
    <div className="mt-10 grid gap-10 sm:grid-cols-2">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink-900">{t.address}</h3>
        <address className="mt-2 not-italic leading-relaxed text-ink-600">
          {shown ? (
            <>
              <span className="block">{shown}</span>
              <span className="mt-1 block text-sm text-ink-400">
                <span className="mr-1.5">{t.addressForMaps}</span>
                {/* 한글 원문은 그대로 복사해 쓸 수 있어야 하므로 번역·변형하지 않는다 */}
                <span lang="ko">{address}</span>
              </span>
            </>
          ) : (
            address
          )}
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
            href={`https://map.naver.com/p/search/${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-clay-600 hover:underline"
          >
            {dict.ui.naverMap}
          </a>
          <a
            href={mapUrl ?? "#"}
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
