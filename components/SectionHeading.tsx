/**
 * 섹션 머리말 — 작은 라벨(eyebrow) + 세리프 제목. 에디토리얼 리듬의 기준.
 * tone="dark" 는 ink-900 다크 밴드 위에서 쓴다.
 * ⚠️ 다크 eyebrow 는 clay-400 고정 — clay-500/600 은 ink-900 위 대비 미달(globals.css 주석 참조).
 */
export function SectionHeading({
  eyebrow,
  title,
  id,
  lead,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  id: string;
  lead?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="max-w-2xl">
      <p
        className={`text-xs font-medium uppercase tracking-[0.2em] ${dark ? "text-clay-400" : "text-clay-500"}`}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`mt-3 font-serif text-2xl font-bold leading-tight sm:text-3xl ${dark ? "text-ivory-50" : "text-ink-900"}`}
      >
        {title}
      </h2>
      {lead && (
        <p className={`mt-3 leading-relaxed ${dark ? "text-ivory-200/80" : "text-ink-600"}`}>
          {lead}
        </p>
      )}
    </div>
  );
}
