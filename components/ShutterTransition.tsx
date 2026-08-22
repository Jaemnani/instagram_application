"use client";

import { useEffect, useRef } from "react";

/** 조리개가 열리고 닫히는 시간 — globals.css 의 transition 과 반드시 같이 맞춘다 */
const OPEN_MS = 1100;
const CLOSE_MS = 450;
/**
 * 전환이 끝난 뒤 휠을 더 삼키는 시간.
 * 한 번의 손짓이 wheel 이벤트 수십 개를 만들기 때문에(트랙패드는 관성까지 붙는다),
 * 전환이 끝나자마자 풀어 주면 남은 이벤트가 그대로 흘러 다음 장면을 건너뛴다
 * (실측: 닫히자마자 푸터까지 내려가 예약 화면을 볼 틈이 없었다).
 */
const SETTLE_MS = 550;

/**
 * 셔터 전환 — 오시는 길과 예약(BOOK NOW) 사이를 조리개로 넘긴다.
 *
 * 화면이 위로 밀리는 모습(= 휠이 내려가는 모습)이 보이지 않는 게 핵심이다.
 * 그래서 곰돌이 장면을 별도 스크롤 구간으로 두지 않고 **화면 고정 오버레이**로
 * 만들고, 페이지 이동은 조리개가 화면을 다 덮고 있는 동안에만 시킨다.
 *
 *   오시는 길에서 휠 ↓
 *     → 스크롤을 막고, 그 화면 위에서 조리개가 열린다 (곰돌이가 드러남)
 *     → 다 덮인 뒤 예약 화면으로 순간 이동 (덮여 있어 이동이 안 보인다)
 *   한 번 더 휠 ↓
 *     → 조리개가 닫히며 그 아래 예약 화면이 드러난다
 *
 * 위로 올릴 때도 대칭으로 동작한다(예약 → 조리개 → 오시는 길).
 *
 * 스크롤을 잠깐 가로채므로 조건을 좁게 둔다 — 풀페이지 스냅이 켜지는 화면(데스크톱
 * + 정밀 포인터 + 충분한 높이)에서만, 그리고 reduced-motion 이면 아예 손대지 않는다.
 * 키보드·터치·스크롤바 조작은 그대로 두어 언제든 평범하게 오갈 수 있다.
 */
export function ShutterTransition() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = ref.current;
    if (!overlay) return;

    const snapping = window.matchMedia(
      "(min-width: 1024px) and (min-height: 760px) and (pointer: fine)",
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!snapping.matches || reduce.matches) return;

    let busy = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const topOf = (el: HTMLElement) => Math.round(el.getBoundingClientRect().top + window.scrollY);
    /** 그 장면에 정확히 서 있는가 — 이동 중에는 발동하지 않게 좁게 본다 */
    const standingOn = (el: HTMLElement) => Math.abs(Math.round(window.scrollY) - topOf(el)) < 4;

    const jumpTo = (y: number) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

    /*
     * 전환하는 동안에는 스냅을 아예 꺼 둔다.
     * 휠을 preventDefault 해도 mandatory 스냅이 스스로 가까운 안착점으로 스크롤을
     * 끌어당긴다(실측: 닫기 시작 220ms 에 예약 화면에서 푸터 쪽으로 334px 점프.
     * scroll 이벤트로 되돌리는 방식으로는 못 잡았다). 조리개가 열리고 닫히는 동안
     * 화면이 움직이면 연출이 깨지므로, 그 구간만 스냅의 손을 뗀다.
     * 이 동안 휠은 busy 가드가 삼키므로 스냅이 없어도 화면이 흐르지 않는다.
     */
    const html = document.documentElement;
    const snapOff = () => (html.style.scrollSnapType = "none");
    const snapOn = () => html.style.removeProperty("scroll-snap-type");

    /** 지금 서 있는 화면에서 조리개를 열고, 다 덮인 뒤 목적지로 옮긴다 */
    const openThenJump = (to: HTMLElement) => {
      busy = true;
      snapOff(); // 여는 동안 이 화면에 머문다
      overlay.setAttribute("data-active", "");
      // 다음 프레임에 열어야 display 전환 뒤 transition 이 걸린다
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.setAttribute("data-open", "")));
      timer = setTimeout(() => {
        jumpTo(topOf(to)); // 덮여 있는 동안 옮긴다 — 스냅이 꺼져 있어 그대로 선다
        timer = setTimeout(() => (busy = false), SETTLE_MS);
      }, OPEN_MS);
    };

    /** 조리개를 닫아 그 아래 화면을 드러낸다 */
    const close = () => {
      busy = true;
      const dest = Math.round(window.scrollY); // 지금 드러날 화면의 자리
      overlay.removeAttribute("data-open");
      timer = setTimeout(() => {
        overlay.removeAttribute("data-active");
        timer = setTimeout(() => {
          // 스냅을 되돌리기 전에 자리를 확정한다 — 안 그러면 켜는 순간 끌려간다
          jumpTo(dest);
          snapOn();
          busy = false;
        }, SETTLE_MS);
      }, CLOSE_MS);
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // 가로 제스처는 관여하지 않는다
      const location = document.getElementById("location");
      const book = document.getElementById("book");
      if (!location || !book) return;

      // 전환 중에는 휠을 삼킨다 — 중간에 끼어들면 장면과 조리개가 어긋난다
      if (busy) {
        e.preventDefault();
        return;
      }

      const open = overlay.hasAttribute("data-open");

      if (open) {
        // 덮여 있는 상태 — 어느 방향이든 다음 휠은 "닫기"다
        e.preventDefault();
        close();
        return;
      }

      if (e.deltaY > 0 && standingOn(location)) {
        e.preventDefault();
        openThenJump(book);
        return;
      }

      if (e.deltaY < 0 && standingOn(book)) {
        e.preventDefault();
        openThenJump(location);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (timer) clearTimeout(timer);
      snapOn();
      overlay.removeAttribute("data-open");
      overlay.removeAttribute("data-active");
    };
  }, []);

  return (
    // 이 컴포넌트는 페이지 최상위에 놓인다 — 조상에 transform 이 없어야
    // position: fixed 가 화면 기준으로 고정된다.
    <div ref={ref} className="shutter" aria-hidden="true">
      <div className="shutter-iris">
        {/* next/image 대신 순수 img — 오버레이는 화면 밖에서 미리 받아두면 그만이고,
            레이아웃 계산에 끼어들 필요가 없다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/sticker-cam-bear.webp" alt="" width={900} height={497} />
        <p>Ready when you are</p>
      </div>
    </div>
  );
}
