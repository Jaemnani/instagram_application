"use client";

import { useEffect, useRef } from "react";

/**
 * 스테이트먼트 채움 컨트롤러 — 서버가 분절해 둔 .statement-word 들을
 * 스크롤 진행률에 맞춰 앞에서부터 data-on 으로 켠다.
 *
 * 안전 설계: 텍스트의 기본색은 진한 잉크색이고, "아직 안 채워진" 연한 상태는
 * 이 컴포넌트가 data-statement-ready 를 붙인 뒤에만 존재한다(globals.css).
 * 그래서 JS 미실행·IO 미지원·reduced-motion 어느 경우에도 글이 항상 온전히 보인다.
 *
 * 성능: IntersectionObserver 로 섹션이 뷰포트 근처일 때만 scroll 리스너를 붙이고,
 * rAF 로 스로틀하며, 프레임마다 이전 개수와 달라진 span 만 토글한다(O(변경분)).
 */
export function StatementFill({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = Array.from(root.querySelectorAll<HTMLElement>(".statement-word"));
    if (words.length === 0) return;

    root.setAttribute("data-statement-ready", "");

    let lastCount = 0;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      // 섹션 상단이 화면 85% 지점에 닿으면 시작해, 뷰포트를 통과하는 동안 채운다.
      const progress = Math.min(
        1,
        Math.max(0, (vh * 0.85 - rect.top) / (rect.height + vh * 0.35)),
      );
      const count = Math.round(progress * words.length);
      if (count === lastCount) return;
      const [from, to] = count > lastCount ? [lastCount, count] : [count, lastCount];
      for (let i = from; i < to; i++) {
        if (i < count) words[i].setAttribute("data-on", "");
        else words[i].removeAttribute("data-on");
      }
      lastCount = count;
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
      // 근처에 오기 전에 미리 붙여 첫 프레임부터 자연스럽게 반응한다.
      { rootMargin: "25% 0px 25% 0px" },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.removeAttribute("data-statement-ready");
    };
  }, []);

  return (
    <div ref={ref} className="space-y-3">
      {children}
    </div>
  );
}
