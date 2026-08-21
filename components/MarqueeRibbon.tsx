/**
 * 브랜드 마퀴 리본 — 브랜드 문구가 끝없이 흐르는 띠.
 *
 * 순수 CSS 애니메이션(JS 0). 동일한 트랙을 두 번 렌더하고 전체를 -50% 만큼
 * 이동시키는 고전 기법이라 이어지는 지점이 보이지 않는다.
 *
 * variant="flat"   — 히어로와 본문 사이의 얇은 이음새(종이 톤).
 * variant="tilted" — 다크 섹션 위를 가로지르는 흰 사선 띠. 두 줄을 서로 반대
 *                    각도·반대 방향으로 겹치면 교차하며 지나가는 인상이 된다.
 *
 * 전체를 aria-hidden 으로 둔다 — 브랜드 태그라인의 장식적 반복이라 스크린리더가
 * 같은 문구를 여러 번 읽을 이유가 없다. 포커스 가능한 요소도 없다.
 * 움직임을 원치 않는 사용자에게는 애니메이션 없이 정지 상태로 보인다(globals.css).
 */
const PHRASE = "No Posed · Just Kidding · Studio Playground · Kidding Seongsu · ";

function Track({ tone }: { tone: "clay" | "ink" }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap text-xs font-medium uppercase tracking-[0.25em] ${
        tone === "clay" ? "text-clay-600" : "text-ink-900"
      }`}
    >
      {PHRASE.repeat(4)}
    </span>
  );
}

export function MarqueeRibbon({
  variant = "flat",
  reverse = false,
  className = "",
}: {
  variant?: "flat" | "tilted";
  reverse?: boolean;
  className?: string;
}) {
  if (variant === "tilted") {
    return (
      // 회전하면 양 끝에 빈 삼각형이 생기므로 화면보다 넓게 뽑아 덮는다.
      <div
        aria-hidden="true"
        // 회전하면 띠의 bounding box 가 세로로 커진다. 부모에 여백이 없으면
        // overflow-hidden 이 위아래 모서리를 잘라 띠 끝이 삐뚤어져 보인다.
        className={`pointer-events-none absolute inset-x-0 z-20 overflow-hidden py-10 ${className}`}
      >
        <div
          // 회전하면 글자 블록이 띠 경계를 넘기 쉬워 상하 여백을 넉넉히 준다
          className={`-mx-[8%] flex w-[116%] items-center bg-ivory-50 py-5 shadow-sm ${reverse ? "rotate-[3deg]" : "-rotate-[3deg]"}`}
        >
          <div className={`flex w-max ${reverse ? "marquee-track-reverse" : "marquee-track"}`}>
            <Track tone="ink" />
            <Track tone="ink" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-ivory-200 bg-clay-50 py-3">
      <div className="marquee-track flex w-max">
        <Track tone="clay" />
        <Track tone="clay" />
      </div>
    </div>
  );
}
