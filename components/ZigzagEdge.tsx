import { useId } from "react";

/**
 * 다크 밴드의 지그재그 경계 — 종이를 삼각 가위로 자른 듯한 이음새.
 *
 * 스택 순서상 다크 섹션의 "바로 앞/뒤"에 두고, 삼각형만 잉크색으로 칠한다.
 * 스트립 자체는 투명이라 밑에 깔린 밝은 섹션 배경이 그대로 비친다.
 * direction="into"  — 밝은 섹션 → 다크 밴드로 들어가는 상단 이음새 (▲ 줄)
 * direction="out"   — 다크 밴드 → 밝은 섹션으로 나오는 하단 이음새 (▼ 줄)
 */
export function ZigzagEdge({ direction }: { direction: "into" | "out" }) {
  const id = useId();
  const path = direction === "into" ? "M0 12 L12 0 L24 12 Z" : "M0 0 L24 0 L12 12 Z";
  return (
    <div aria-hidden="true" className={direction === "into" ? "-mb-px" : "-mt-px"}>
      <svg className="block h-3 w-full" preserveAspectRatio="none" role="presentation">
        <defs>
          <pattern id={id} width="24" height="12" patternUnits="userSpaceOnUse">
            <path d={path} fill="var(--color-ink-900)" />
          </pattern>
        </defs>
        <rect width="100%" height="12" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}
