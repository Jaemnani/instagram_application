import { services } from "@/lib/content";

/** 제공 서비스 — 검색어를 담은 텍스트 블록. OfferCatalog JSON-LD와 짝을 이룬다. */
export function ServiceGrid() {
  return (
    <ul className="mt-10 grid gap-px overflow-hidden rounded-sm bg-ivory-200 sm:grid-cols-2">
      {services.map((s, i) => (
        <li key={s.name} className="bg-ivory-50 p-7 sm:p-8">
          <p className="font-serif text-sm text-clay-500">
            {String(i + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-3 font-serif text-xl font-bold text-ink-900">{s.name}</h3>
          <p className="mt-3 text-[15px] leading-[1.85] text-ink-600">{s.description}</p>
        </li>
      ))}
    </ul>
  );
}
