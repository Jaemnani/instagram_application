import Image from "next/image";

import { Reveal } from "@/components/Reveal";

/**
 * 장면 사이의 숨 고르기 — 어두운 화면에 카메라와 곰돌이만 떠오른다.
 *
 * 오시는 길에서 예약(BOOK NOW)으로 넘어가기 직전에 한 장면을 비워, 다음 장면이
 * 더 크게 들어오게 만드는 장치다. 배경이 다음 섹션과 같은 잉크색이라 넘어갈 때
 * 배경은 그대로 있고 그림만 바뀌는 것처럼 보인다.
 *
 * 순수 장식(aria-hidden)이라 색인·접근성과 무관하다. 등장은 기존 Reveal 규칙을
 * 그대로 쓰므로 reduced-motion 에서는 애니메이션 없이 그냥 보인다.
 *
 * ⚠️ overflow-hidden 을 주지 말 것 — 그 자리에 스크롤 포트가 생겨 휠 대상이 이
 * 섹션으로 고정되고, 페이지 스냅이 제대로 걸리지 않아 스르륵 흘러간다(가로 갤러리
 * 스트립에서 겪은 것과 같은 함정). 스티커는 화면 안에 들어오므로 잘라낼 것도 없다.
 */
export function FadeTransition() {
  return (
    <section
      aria-hidden="true"
      className="snap-page relative flex min-h-svh items-center justify-center bg-ink-900"
    >
      <Reveal className="flex flex-col items-center gap-8">
        <Image
          src="/brand/sticker-cam-bear.webp"
          alt=""
          width={900}
          height={497}
          className="w-64 sm:w-80 lg:w-[28rem]"
        />
        <p className="text-[11px] uppercase tracking-[0.4em] text-ivory-300/60">
          Ready when you are
        </p>
      </Reveal>
    </section>
  );
}
