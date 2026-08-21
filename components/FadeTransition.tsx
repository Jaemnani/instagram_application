import Image from "next/image";

import { IrisReveal } from "@/components/IrisReveal";

/**
 * 셔터가 열리는 한 장면 — 오시는 길(밝은 종이)에서 휠을 내리면 화면 한가운데에서
 * 검은 원이 퍼지며 카메라와 곰돌이가 나타나 화면을 가득 채운다. 다음 장면으로
 * 넘어갈 때는 그 원이 다시 닫히면서 넘어간다(카메라 셔터의 은유).
 *
 * 배경 구성이 핵심이다 — 섹션 자체는 앞 장면과 같은 밝은 종이색이고, 어두운 배경은
 * 조리개 *안쪽*에 있다. 그래서 원이 커질 때 "밝은 화면에 검은 원이 퍼지는" 것이
 * 그대로 보인다. 섹션까지 어둡게 칠하면 원이 퍼지는 게 안 보인다.
 *
 * 순수 장식(aria-hidden)이라 색인·접근성과 무관하다. JS 미실행·reduced-motion 에서는
 * 조리개 없이 처음부터 열린 상태로 보인다(IrisReveal 의 안전 기본값).
 *
 * ⚠️ overflow-hidden 을 주지 말 것 — 그 자리에 스크롤 포트가 생겨 휠 대상이 이
 * 섹션으로 고정되고, 페이지 스냅이 제대로 걸리지 않아 스르륵 흘러간다(가로 갤러리
 * 스트립에서 겪은 것과 같은 함정).
 */
export function FadeTransition() {
  return (
    <section aria-hidden="true" className="snap-page relative min-h-svh bg-ivory-100">
      <IrisReveal className="absolute inset-0">
        <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-ink-900">
          <Image
            src="/brand/sticker-cam-bear.webp"
            alt=""
            width={900}
            height={497}
            className="w-[78vw] max-w-[52rem]"
          />
          <p className="text-[11px] uppercase tracking-[0.4em] text-ivory-300/60">
            Ready when you are
          </p>
        </div>
      </IrisReveal>
    </section>
  );
}
