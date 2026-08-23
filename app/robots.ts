import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

/**
 * AI 크롤러는 2026 년 기준 **학습용과 검색용이 분리**되어 있다.
 * 인용되려면 "검색용"이 반드시 들어와야 한다 — 한 봇이 막히면 그 엔진에서
 * 인용 기회의 18~34% 를 잃는다는 감사 결과가 있다.
 *
 *   OpenAI     GPTBot(학습) / OAI-SearchBot(ChatGPT 검색 색인) / ChatGPT-User(사용자 요청 페치)
 *   Anthropic  ClaudeBot(학습) / Claude-SearchBot(Claude 검색) / Claude-User(대화 중 페치)
 *   Google     Googlebot(검색) / Google-Extended(Gemini 학습)
 *   기타       PerplexityBot, Perplexity-User, Applebot(-Extended), Bingbot, Bytespider, Amazonbot
 *
 * 이 사이트는 공개 홍보가 목적이라 학습·검색 모두 허용한다. 학습만 빼고 싶어지면
 * GPTBot·ClaudeBot·Google-Extended·Applebot-Extended·CCBot 만 disallow 하고
 * 검색용은 allow 로 남기면 된다(그래야 답변에 인용될 자격은 유지된다).
 */
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Google — Googlebot 이 검색·AI Overviews 색인, Google-Extended 는 Gemini 학습
  "Googlebot",
  "Google-Extended",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Apple Intelligence
  "Applebot",
  "Applebot-Extended",
  // 그 외 주요 엔진
  "Bingbot",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 생성형 엔진 크롤러 명시 허용 (GEO). `*` 로도 통과하지만, 자기 이름 규칙을
      // 우선 적용하는 봇이 있어 명시해 두는 편이 안전하다.
      { userAgent: AI_CRAWLERS, allow: "/" },
      { userAgent: "*", allow: "/" },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
