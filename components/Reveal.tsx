"use client";

import { useEffect, useRef } from "react";

/**
 * 스크롤로 들어오면 페이드업.
 *
 * 내용은 항상 DOM 에 있고 opacity 만 바뀌므로 크롤러/스크린리더에 영향이 없다.
 * 실제 전환 규칙은 globals.css 에 있고, 여기서는 화면에 들어온 시점만 표시한다.
 * - prefers-reduced-motion: reduce → CSS 규칙 자체가 적용되지 않아 항상 보인다.
 * - JS 미실행 → layout 의 <noscript> 스타일이 보이도록 되돌린다.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // IntersectionObserver 미지원 환경에서는 즉시 표시한다.
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.reveal = "shown";
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.dataset.reveal = "shown";
          io.disconnect();
        }
      },
      // 요소가 조금 올라온 뒤 시작해야 스크롤과 동작이 맞물린다.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      data-reveal=""
      className={className}
    >
      {children}
    </Tag>
  );
}
