import type { Dictionary } from "@/lib/i18n";

/**
 * 제공 서비스 — 검색어를 담은 텍스트 블록. OfferCatalog JSON-LD 와 짝을 이룬다.
 * compact 는 이야기와 한 화면에 나란히 놓일 때 쓰는 조밀한 변형.
 */
export function ServiceGrid({ dict, compact = false }: { dict: Dictionary; compact?: boolean }) {
  return (
    <ul
      className={`grid gap-px overflow-hidden rounded-sm bg-ivory-200 ${
        compact ? "mt-6 sm:grid-cols-2" : "mt-10 sm:grid-cols-2"
      }`}
    >
      {dict.services.items.map((s, i) => (
        <li key={s.name} className={`bg-ivory-50 ${compact ? "p-5" : "p-7 sm:p-8"}`}>
          <p className="font-serif text-sm text-clay-500">{String(i + 1).padStart(2, "0")}</p>
          <h3
            className={`mt-2 font-serif font-bold text-ink-900 ${compact ? "text-base" : "mt-3 text-xl"}`}
          >
            {s.name}
          </h3>
          <p
            className={`text-ink-600 ${compact ? "mt-1.5 text-[13px] leading-[1.7]" : "mt-3 text-[15px] leading-[1.85]"}`}
          >
            {s.description}
          </p>
        </li>
      ))}
    </ul>
  );
}
