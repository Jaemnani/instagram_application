/**
 * 브랜드 마퀴 리본 — 히어로(다크 사진)와 종이 콘텐츠 사이의 이음새.
 *
 * 순수 CSS 애니메이션(JS 0). 동일한 트랙을 두 번 렌더하고 전체를 -50% 만큼
 * 이동시키는 고전 기법이라 이어지는 지점이 보이지 않는다.
 *
 * 전체를 aria-hidden 으로 둔다 — 내용이 브랜드 태그라인의 장식적 반복이라
 * 스크린리더가 같은 문구를 여덟 번 읽을 이유가 없다. 포커스 가능한 요소도 없다.
 * 움직임을 원치 않는 사용자에게는 애니메이션 없이 정지 상태로 보인다(globals.css).
 */
const PHRASE = "No Posed · Just Kidding · Studio Playground · Kidding Seongsu · ";

function Track() {
  return (
    <span className="shrink-0 whitespace-nowrap text-xs font-medium uppercase tracking-[0.25em] text-clay-600">
      {PHRASE.repeat(4)}
    </span>
  );
}

export function MarqueeRibbon() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-ivory-200 bg-clay-50 py-3"
    >
      <div className="marquee-track flex w-max">
        <Track />
        <Track />
      </div>
    </div>
  );
}
