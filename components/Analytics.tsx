"use client";

import Script from "next/script";
import { useEffect } from "react";

/**
 * GA4 + 생성형 엔진 유입 추적.
 *
 * `NEXT_PUBLIC_GA_ID` 가 없으면 아무것도 렌더하지 않는다 — 로컬·프리뷰에서는
 * 자동으로 꺼지고, 키를 넣는 순간 켜진다(빌드·화면에 영향 0).
 *
 * ── 왜 별도 이벤트를 보내나
 * AI 답변에서 넘어온 방문은 GA4 기본 리포트에서 잘 안 보인다. referrer 를 아예
 * 안 보내는 엔진이 있어 "직접 유입(direct)"으로 뭉뚱그려지기 때문이다. 그래서
 * referrer 가 잡히는 경우라도 `ai_referral` 이벤트로 따로 남겨, 어느 엔진이
 * 우리를 인용했는지 세어 볼 수 있게 한다.
 *
 * GA4 콘솔에서 한 번만 해 두면 리포트에 뜬다:
 *   관리 → 맞춤 정의 → 맞춤 측정기준 만들기 → 이벤트 매개변수 `ai_source`
 */

/** 답변에 우리를 인용해 보낸 곳들. host 끝부분으로 판정한다. */
const AI_HOSTS: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "openai.com": "OpenAI",
  "perplexity.ai": "Perplexity",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "bard.google.com": "Gemini",
  "copilot.microsoft.com": "Copilot",
  "edgeservices.bing.com": "Copilot",
  "you.com": "You.com",
  "phind.com": "Phind",
  "poe.com": "Poe",
  "meta.ai": "Meta AI",
  "grok.com": "Grok",
  "x.ai": "Grok",
  "felo.ai": "Felo",
  "genspark.ai": "Genspark",
  "wrtn.ai": "뤼튼",
  "clova-x.naver.com": "CLOVA X",
  "cue.search.naver.com": "네이버 큐",
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function matchAiSource(referrer: string): string | null {
  if (!referrer) return null;
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const [needle, label] of Object.entries(AI_HOSTS)) {
    // 서브도메인까지 포함해 판정하되, 다른 도메인의 접미사 우연 일치는 막는다
    if (host === needle || host.endsWith(`.${needle}`)) return label;
  }
  return null;
}

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!gaId) return;

    /*
     * 아래 인라인 <script> 는 첫 로드 때 HTML 파서가 실행한다. 다만 클라이언트에서
     * 이 컴포넌트가 새로 마운트되는 경우(브라우저는 innerHTML 로 삽입된 script 를
     * 실행하지 않는다) gtag 가 없을 수 있어, 여기서 한 번 더 보장한다.
     * 이미 정의돼 있으면 손대지 않으므로 config 가 두 번 불리지 않는다.
     */
    window.dataLayer = window.dataLayer ?? [];
    if (typeof window.gtag !== "function") {
      // 표준 스니펫과 같은 형태 — GA 는 arguments 객체가 쌓이기를 기대한다
      const gtag = function (this: unknown) {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments);
      } as (...args: unknown[]) => void;
      window.gtag = gtag;
      gtag("js", new Date());
      gtag("config", gaId);
    }

    const source = matchAiSource(document.referrer);
    if (!source) return;
    window.gtag("event", "ai_referral", {
      ai_source: source,
      page_location: window.location.href,
    });
  }, [gaId]);

  if (!gaId) return null;

  /*
   * 초기화는 일반 <script> 로 서버 HTML 에 넣는다 — Google 공식 스니펫과 같은 순서다.
   * next/script 의 인라인은 하이드레이션 후에야 주입돼 (a) 초기 HTML 에 없어 검증이
   * 어렵고 (b) 그 전에 실행되는 코드가 gtag 를 못 찾는다. 여기서 먼저 정의해 두면
   * 외부 gtag.js 가 로드되기 전 호출도 dataLayer 에 쌓였다가 로드 시 함께 처리된다.
   */
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            `window.dataLayer=window.dataLayer||[];` +
            `function gtag(){dataLayer.push(arguments)}` +
            `window.gtag=gtag;` +
            `gtag('js',new Date());` +
            // `<` 를 이스케이프해야 값 안의 `</script>` 로 스크립트를 닫을 수 없다.
            // JSON.stringify 는 따옴표·역슬래시만 처리하고 `<` 는 그대로 둔다 —
            // 같은 이유로 lib/seo/jsonld.ts 의 serializeLd 도 이 치환을 한다.
            `gtag('config',${JSON.stringify(gaId).replace(/</g, "\\u003c")});`,
        }}
      />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
    </>
  );
}
