/**
 * 원형 텍스트 도장 뱃지 — 천천히 도는 브랜드 스탬프 (다크 배경용).
 *
 * 텍스트는 브랜드 영문 상수라 번역하지 않고, 전체를 장식(aria-hidden)으로 둔다.
 * 회전은 globals.css 의 .stamp-spin (reduced-motion 시 정지).
 * textLength 로 원둘레에 글자를 고르게 펴서 폰트별 폭 차이에 흔들리지 않는다.
 */
export function StampBadge({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={`stamp-spin ${className}`}
    >
      <defs>
        <path
          id="stamp-text-circle"
          d="M60,60 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0"
          fill="none"
        />
      </defs>
      <circle cx="60" cy="60" r="58" fill="none" stroke="var(--color-clay-400)" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="var(--color-clay-400)" strokeWidth="1" />
      <text
        fill="var(--color-ivory-200)"
        fontSize="10.5"
        fontWeight="600"
        letterSpacing="1.5"
        style={{ fontFamily: "var(--font-brand)" }}
      >
        <textPath href="#stamp-text-circle" textLength="278">
          NO POSED · JUST KIDDING · SEONGSU SEOUL ·
        </textPath>
      </text>
      {/* 가운데 웃는 얼굴 — 두 점 + 웃음 호 */}
      <g stroke="var(--color-ivory-200)" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <circle cx="51" cy="55" r="1.6" fill="var(--color-ivory-200)" stroke="none" />
        <circle cx="69" cy="55" r="1.6" fill="var(--color-ivory-200)" stroke="none" />
        <path d="M50 66 Q60 74 70 66" />
      </g>
    </svg>
  );
}
