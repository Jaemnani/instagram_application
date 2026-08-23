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
    const source = matchAiSource(document.referrer);
    if (!source) return;
    // gtag 로드 전이라도 dataLayer 에 쌓아두면 로드 시점에 함께 처리된다
    window.dataLayer = window.dataLayer ?? [];
    window.gtag?.("event", "ai_referral", {
      ai_source: source,
      page_location: window.location.href,
    });
  }, [gaId]);

  if (!gaId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
