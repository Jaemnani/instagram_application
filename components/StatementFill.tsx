"use client";

import { useEffect, useRef } from "react";

/** 단어가 하나씩 진해지는 간격(ms). 문장 전체가 약 2초 안에 다 채워지는 속도. */
const STEP_MS = 55;

/**
 * 스테이트먼트 채움 컨트롤러 — 서버가 분절해 둔 .statement-word 들을 앞에서부터
 * 하나씩 켠다.
 *
 * 풀페이지 스냅에서는 장면이 화면에 딱 맞아 스크롤이 거의 일어나지 않으므로,
 * 스크롤 진행률이 아니라 **장면에 들어선 순간**을 신호로 삼는다. 화면을 벗어나면
 * 되돌려, 다시 올라왔을 때 처음부터 다시 채워진다.
 *
 * 안전 설계: 텍스트의 기본색은 진한 잉크색이고, "아직 안 채워진" 연한 상태는
 * 이 컴포넌트가 data-statement-ready 를 붙인 뒤에만 존재한다(globals.css).
 * 그래서 JS 미실행·IO 미지원·reduced-motion 어느 경우에도 글이 항상 온전히 보인다.
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

    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const reset = () => {
      stop();
      for (const w of words) w.removeAttribute("data-on");
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // 장면에 들어섰다 — 앞 단어부터 차례로 켠다.
          stop();
          let i = 0;
          timer = setInterval(() => {
            if (i >= words.length) {
              stop();
              return;
            }
            words[i].setAttribute("data-on", "");
            i++;
          }, STEP_MS);
        } else {
          reset();
        }
      },
      // 장면의 절반 이상이 보일 때만 시작 — 스치듯 지나갈 때는 켜지 않는다.
      { threshold: 0.5 },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      stop();
      root.removeAttribute("data-statement-ready");
    };
  }, []);

  return (
    <div ref={ref} className="space-y-3">
      {children}
    </div>
  );
}
