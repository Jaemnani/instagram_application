"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * 렌즈 관통 전환 — 스크롤하면 카메라 뒤에서 검은 원(조리개)이 열리듯 커져
 * 화면을 삼키고, 그대로 다음 다크 섹션으로 이어진다.
 *
 * 뷰포트보다 긴 스페이서 안에 sticky 무대를 두고, 스크롤 진행률을 CSS 변수
 * --lens(0~1)로만 넘긴다. 실제 변형은 transform: scale 하나뿐이라 컴포지터에서만 돈다.
 *
 * 순수 장식(aria-hidden)이라 SEO·접근성과 무관하다. 그래서 기본은 display:none 이고,
 * 데스크톱 + 움직임 허용 환경에서 JS 가 붙을 때만 나타난다 — JS 미실행·모바일·
 * reduced-motion 에서는 이 구간이 통째로 없는 것과 같아(긴 빈 스크롤이 생기지 않는다).
 */
export function LensTransition() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    root.setAttribute("data-lens-ready", "");

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / travel));
      root.style.setProperty("--lens", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          update();
          window.addEventListener("scroll", onScroll, { passive: true });
        } else {
          window.removeEventListener("scroll", onScroll);
        }
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.removeAttribute("data-lens-ready");
    };
  }, []);

  return (
    <div ref={ref} data-lens aria-hidden="true" className="relative">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden bg-ivory-100">
        {/* 열리는 조리개 — 다음 섹션과 같은 잉크색이라 그대로 이어진다 */}
        <span className="lens-iris" />
        <span className="lens-cam relative block w-72 xl:w-96">
          <Image
            src="/brand/sticker-cam-bear.webp"
            alt=""
            width={900}
            height={497}
            className="w-full"
          />
        </span>
        <p className="lens-cam absolute bottom-24 text-[11px] uppercase tracking-[0.4em] text-ink-400">
          Look through
        </p>
      </div>
    </div>
  );
}
