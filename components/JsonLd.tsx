import { serializeLd } from "@/lib/seo/jsonld";

type Json = Record<string, unknown>;

/** JSON-LD 구조화 데이터를 안전하게 렌더 (null은 건너뜀). */
export function JsonLd({ data }: { data: (Json | null)[] | Json }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean) as Json[];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeLd(item) }}
        />
      ))}
    </>
  );
}
