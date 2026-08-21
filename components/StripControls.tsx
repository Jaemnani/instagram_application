"use client";

import { useEffect, useState } from "react";

/**
 * 가로 스크롤 스트립의 화살표.
 *
 * 스트립 자체는 서버 컴포넌트로 두고 여기만 클라이언트로 분리했다 — 카드 렌더에 필요한
 * dict 에는 함수가 들어 있어 클라이언트 경계를 넘기면 빌드가 깨진다. 그래서 이 컴포넌트는
 * 문자열 라벨과 대상 id 만 받고, DOM 에서 스트립을 찾아 스크롤한다.
 *
 * JS 가 없어도 스트립은 네이티브 스크롤로 동작한다 — 화살표는 어디까지나 보조 장치다.
 */
export function StripControls({
  targetId,
  labels,
  tone = "light",
}: {
  targetId: string;
  labels: { prev: string; next: string };
  tone?: "light" | "dark";
}) {
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false });

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const update = () => {
      // 소수점 오차로 끝에 닿아도 end 가 안 잡히는 일이 있어 1px 여유를 둔다.
      const max = el.scrollWidth - el.clientWidth;
      setEdge({ start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 });
    };
    update();

    /*
     * 이 스트립은 "가로로 넘겨 보는" 갤러리다. 그래서 그 위에서는 세로 휠을
     * 가로 이동으로 바꿔 준다 — 마우스 휠만 있는 사용자도 옆으로 넘길 수 있다.
     *
     * 끝(왼쪽 처음 / 오른쪽 마지막)에 닿은 뒤 같은 방향으로 더 굴리면
     * preventDefault 하지 않고 그대로 흘려보낸다. 그러면 브라우저가 페이지를
     * 스크롤해 다음 장면으로 넘어간다(풀페이지 스냅이 받는다).
     * ⚠️ 여기서 페이지를 직접 옮기려 하면 안 된다 — mandatory 스냅이 그 이동을
     * 곧바로 되돌려 스크롤이 갇힌다(실측). 판단만 하고 브라우저에 맡긴다.
     */
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // 가로 제스처는 그대로
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return; // 넘길 것이 없으면 페이지 스크롤에 맡긴다
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft >= max - 1;
      if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [targetId]);

  const scroll = (dir: 1 | -1) => {
    const el = document.getElementById(targetId);
    if (!el) return;

    // 카드 한 장 + 간격만큼 이동. 첫 카드 폭을 재서 화면 크기에 자동으로 맞춘다.
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    // 움직임을 원치 않는 사용자에게는 애니메이션 없이 바로 이동한다.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: step * dir, behavior: reduce ? "auto" : "smooth" });
  };

  // 스크롤할 것이 없으면(카드가 화면에 다 들어옴) 화살표를 숨긴다.
  if (edge.start && edge.end) return null;

  // disabled 는 opacity 대신 색을 낮춘다 — 다크 배경에서 opacity-30 은 식별이 어렵다.
  const base =
    tone === "dark"
      ? "flex h-10 w-10 items-center justify-center rounded-full border border-ink-600 bg-ink-800 text-ivory-200 transition enabled:hover:border-clay-400 enabled:hover:text-clay-400 disabled:border-ink-800 disabled:text-ink-600"
      : "flex h-10 w-10 items-center justify-center rounded-full border border-ivory-300 bg-ivory-50 text-ink-600 transition enabled:hover:border-clay-500 enabled:hover:text-clay-600 disabled:opacity-30";

  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" onClick={() => scroll(-1)} disabled={edge.start} aria-label={labels.prev} className={base}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button type="button" onClick={() => scroll(1)} disabled={edge.end} aria-label={labels.next} className={base}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
