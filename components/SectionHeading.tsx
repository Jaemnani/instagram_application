/** 섹션 머리말 — 작은 라벨(eyebrow) + 세리프 제목. 에디토리얼 리듬의 기준. */
export function SectionHeading({
  eyebrow,
  title,
  id,
  lead,
}: {
  eyebrow: string;
  title: string;
  id: string;
  lead?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-clay-500">{eyebrow}</p>
      <h2
        id={id}
        className="mt-3 font-serif text-2xl font-bold leading-tight text-ink-900 sm:text-3xl"
      >
        {title}
      </h2>
      {lead && <p className="mt-3 leading-relaxed text-ink-600">{lead}</p>}
    </div>
  );
}
