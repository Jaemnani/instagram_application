/**
 * 떠다니는 원형 브랜드 스티커 — 화면 우하단에 고정되어 천천히 돈다.
 *
 * 잉크색으로 채운 원이라 밝은 종이·다크 밴드 어디 위에서든 "붙인 스티커"로 읽힌다.
 * 가운데는 윙크 — "Just Kidding"(장난이야)의 표정.
 * 텍스트는 브랜드 영문 상수라 번역하지 않고, 전체를 장식(aria-hidden)으로 둔다.
 * 회전은 globals.css 의 .stamp-spin (reduced-motion 시 정지).
 * textLength 로 원둘레에 글자를 고르게 펴서 폰트별 폭 차이에 흔들리지 않는다.
 */
export function StampBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={`stamp-spin ${className}`}>
      {/* 채운 원판 + 살짝 밝은 테두리 — 스티커의 흰 테처럼 */}
      <circle cx="60" cy="60" r="58" fill="var(--color-ink-900)" />
      <circle cx="60" cy="60" r="55.5" fill="none" stroke="var(--color-ivory-50)" strokeWidth="1.5" />
      <defs>
        <path
          id="stamp-text-circle"
          d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
          fill="none"
        />
      </defs>
      <text
        fill="var(--color-ivory-200)"
        fontSize="10.5"
        fontWeight="600"
        letterSpacing="1.5"
        style={{ fontFamily: "var(--font-brand)" }}
      >
        <textPath href="#stamp-text-circle" textLength="272">
          NO POSED · JUST KIDDING · SEONGSU SEOUL ·
        </textPath>
      </text>
      {/* 가운데 윙크 얼굴 — 왼눈은 점, 오른눈은 찡긋, 큰 웃음 */}
      <g stroke="var(--color-clay-400)" strokeWidth="3" strokeLinecap="round" fill="none">
        <circle cx="49" cy="53" r="2.2" fill="var(--color-clay-400)" stroke="none" />
        <path d="M65 53 L76 53" />
        <path d="M47 64 Q60 76 73 64" />
      </g>
    </svg>
  );
}
