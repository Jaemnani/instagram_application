"use client";

import { useEffect, useRef } from "react";

/**
 * 조리개 열림 — 장면에 들어서면 화면 가운데에서 원이 퍼지며 안의 내용이 드러난다.
 * (카메라 조리개가 열리는 순간의 은유. 예약 장면 진입에 쓴다.)
 *
 * 안전 설계: 기본은 "완전히 열린" 상태다. 닫힌 상태(원 반지름 0)는 이 컴포넌트가
 * data-iris-ready 를 붙인 뒤에만 존재하므로, JS 미실행·reduced-motion 어디서도
 * 내용이 가려지지 않는다.
 *
 * 장면을 벗어나면 다시 닫아 두어, 되돌아왔을 때 열림이 한 번 더 재생된다.
 *
 * ⚠️ 관찰 대상과 클립 대상은 반드시 분리한다 — clip-path 로 잘린 요소는
 * IntersectionObserver 가 "보이지 않는다"고 판단해서, 닫힌 상태에서는 열림 신호가
 * 영영 오지 않는다(실측: 화면 한가운데 있어도 isIntersecting=false).
 * 그래서 바깥 래퍼를 관찰하고, 클립은 안쪽 자식에만 건다.
 */
export function IrisReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root.setAttribute("data-iris-ready", "");

    /*
     * 여는 시점은 "스크롤이 멎은 뒤"여야 한다.
     * IntersectionObserver 로 열면, 스냅이 부드럽게 이동하는 동안 이미 이 장면이
     * 화면을 채워 애니메이션이 시작되고 — 사용자가 도착했을 땐 다 열려 있다.
     * 그래서 효과가 "없는 것처럼" 보인다(실측: 도착 첫 프레임에 clip 137%).
     * scrollend(미지원 브라우저는 디바운스)로 정착을 기다렸다가 연다.
     */
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = () => {
      const rect = root.getBoundingClientRect();
      const mid = window.innerHeight / 2;
      const centered = rect.top < mid && rect.bottom > mid;
      if (centered) root.setAttribute("data-open", "");
      else root.removeAttribute("data-open");
    };

    const onScroll = () => {
      // 이동이 시작되면 닫아 두었다가, 멎었을 때 다시 연다
      root.removeAttribute("data-open");
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, 140);
    };

    const supportsScrollEnd = "onscrollend" in window;
    window.addEventListener("scroll", onScroll, { passive: true });
    if (supportsScrollEnd) window.addEventListener("scrollend", settle);
    settle(); // 이미 이 장면에 서 있는 경우(새로고침 등)

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (supportsScrollEnd) window.removeEventListener("scrollend", settle);
      if (timer) clearTimeout(timer);
      root.removeAttribute("data-iris-ready");
      root.removeAttribute("data-open");
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      <div className="iris h-full">{children}</div>
    </div>
  );
}
