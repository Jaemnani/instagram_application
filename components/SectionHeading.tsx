/**
 * 섹션 머리말 — 작은 라벨(eyebrow) + 세리프 제목. 에디토리얼 리듬의 기준.
 * tone="dark" 는 ink-900 다크 밴드 위에서 쓴다.
 * ⚠️ 다크 eyebrow 는 clay-400 고정 — clay-500/600 은 ink-900 위 대비 미달(globals.css 주석 참조).
 *
 * display: 제목 뒤에 크게 깔리는 아웃라인 영문 백드롭(예: "GALLERY").
 * 장식(aria-hidden)이라 번역·색인과 무관하고, 헤딩 텍스트가 그 위에 얹힌다.
 */
export function SectionHeading({
  eyebrow,
  title,
  id,
  lead,
  tone = "light",
  display,
}: {
  eyebrow: string;
  title: string;
  id: string;
  lead?: string;
  tone?: "light" | "dark";
  display?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className="relative max-w-2xl">
      {display && (
        <span
          aria-hidden="true"
          className={`section-display pointer-events-none absolute -top-[0.42em] left-0 select-none font-brand font-bold uppercase leading-none ${
            dark ? "section-display-dark" : ""
          }`}
        >
          {display}
        </span>
      )}
      <p
        className={`relative text-xs font-medium uppercase tracking-[0.2em] ${dark ? "text-clay-400" : "text-clay-500"}`}
      >
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`relative mt-3 font-serif text-2xl font-bold leading-tight sm:text-3xl ${dark ? "text-ivory-50" : "text-ink-900"}`}
      >
        {title}
      </h2>
      {lead && (
        <p className={`relative mt-3 leading-relaxed ${dark ? "text-ivory-200/80" : "text-ink-600"}`}>
          {lead}
        </p>
      )}
    </div>
  );
}
