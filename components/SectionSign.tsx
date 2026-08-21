/**
 * 섹션에 매달린 간판 — 스크롤하는 동안 화면 위에 붙어 "지금 보고 있는 챕터"를 알려준다.
 *
 * 촬영장 천장에 걸린 사인보드를 흉내낸 장식(aria-hidden)이라 번역·색인과 무관하고,
 * caption 은 이미 사전에 있는 섹션 제목을 그대로 받아 쓴다(새 키 불필요).
 * sticky 는 부모 높이 안에서만 붙으므로 섹션을 벗어나면 자연히 사라진다.
 */
export function SectionSign({ caption }: { caption: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none sticky top-0 z-30 mb-6 flex justify-center"
    >
      <div className="flex flex-col items-center">
        {/* 천장에 매다는 봉 두 개 — 화면 위로 이어지는 인상을 준다 */}
        <div className="flex w-28 justify-between">
          <span className="h-7 w-[3px] bg-ink-600" />
          <span className="h-7 w-[3px] bg-ink-600" />
        </div>
        <div className="rounded-lg border-2 border-ink-600 bg-ink-800 px-7 py-2.5 text-center shadow-xl">
          <p className="font-brand text-sm font-bold uppercase tracking-[0.3em] text-clay-400">
            Now Shooting
          </p>
          <p className="mt-0.5 text-[10px] tracking-[0.18em] text-ivory-300/70">{caption}</p>
        </div>
      </div>
    </div>
  );
}
