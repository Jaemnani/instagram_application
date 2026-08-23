/**
 * GEO/SEO 현황 점검 — 배포된 사이트가 생성형 엔진에 인용될 준비가 됐는지 실제로 확인한다.
 *
 *   npm run geo-check                    # 프로덕션(siteConfig.url) 점검
 *   npm run geo-check -- http://localhost:3005
 *
 * 코드를 읽는 게 아니라 **실제 응답을 받아서** 확인한다. 빌드가 통과해도 배포된 결과가
 * 다를 수 있고(캐시·환경변수·리라이트), GEO 는 그 "배포된 결과"로 판정되기 때문이다.
 *
 * 무엇을 보나
 *   1. robots.txt — 검색용 AI 봇이 막혀 있지 않은지 (한 봇이 막히면 그 엔진 인용 기회를 잃는다)
 *   2. llms.txt   — 응답하는지, 핵심 정보(주소·영업시간·예약)가 들어 있는지
 *   3. sitemap    — 응답하는지, URL 수
 *   4. 각 언어 홈 — JSON-LD 필수 타입, 메타 설명, canonical, hreflang
 *   5. FAQ        — 질문 수와 "직답으로 시작하는지"(AI 는 첫 문장을 인용한다)
 */
import { siteConfig } from "../lib/config";

const BASE = (process.argv[2] || siteConfig.url).replace(/\/$/, "");

/** 검색용 — 막히면 그 엔진 답변에 인용될 수 없다 */
const SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot",
];

const REQUIRED_LD = ["Organization", "WebSite", "FAQPage", "OfferCatalog"];

/**
 * 지역 업체 정보는 타입 이름으로 찾지 않는다 — `@type` 은 BUSINESS_TYPE 환경변수라
 * ProfessionalService·Store 등 LocalBusiness 의 하위 타입이 들어온다(이 사이트는
 * ProfessionalService). 이름 대신 "주소와 영업시간을 가졌는가"로 판정한다.
 */
function hasLocalBusiness(ld: Record<string, unknown>[]): boolean {
  return ld.some((x) => "address" in x && "openingHoursSpecification" in x);
}

type Level = "ok" | "warn" | "fail";
const rows: { level: Level; label: string; detail: string }[] = [];
const add = (level: Level, label: string, detail: string) => rows.push({ level, label, detail });

async function get(path: string): Promise<{ status: number; text: string }> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { "user-agent": "geo-check" } });
    return { status: res.status, text: await res.text() };
  } catch (err) {
    return { status: 0, text: err instanceof Error ? err.message : String(err) };
  }
}

/** robots.txt 를 user-agent 별 규칙으로 거칠게 파싱한다(Allow/Disallow 만 본다) */
function parseRobots(txt: string): Map<string, string[]> {
  const rules = new Map<string, string[]>();
  let agents: string[] = [];
  for (const raw of txt.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const [k, ...rest] = line.split(":");
    const key = k.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      agents = agents.length && rules.has(agents[0]) ? [value.toLowerCase()] : [...agents, value.toLowerCase()];
      for (const a of agents) if (!rules.has(a)) rules.set(a, []);
    } else if (key === "disallow" || key === "allow") {
      for (const a of agents) rules.get(a)?.push(`${key} ${value}`);
      if (key === "disallow") agents = agents.slice();
    }
  }
  return rules;
}

async function checkRobots() {
  const { status, text } = await get("/robots.txt");
  if (status !== 200) return add("fail", "robots.txt", `응답 ${status}`);

  const rules = parseRobots(text);
  const blocked: string[] = [];
  const unlisted: string[] = [];

  for (const bot of SEARCH_BOTS) {
    const own = rules.get(bot.toLowerCase());
    if (!own) {
      unlisted.push(bot);
      continue;
    }
    if (own.some((r) => r === "disallow /")) blocked.push(bot);
  }

  const star = rules.get("*") ?? [];
  const starBlocksAll = star.some((r) => r === "disallow /");

  if (blocked.length) add("fail", "AI 검색 봇", `차단됨: ${blocked.join(", ")}`);
  else if (starBlocksAll && unlisted.length)
    add("fail", "AI 검색 봇", `* 가 전체 차단인데 미명시: ${unlisted.join(", ")}`);
  else if (unlisted.length)
    add("warn", "AI 검색 봇", `명시 없음(* 규칙으로 통과): ${unlisted.join(", ")}`);
  else add("ok", "AI 검색 봇", `${SEARCH_BOTS.length}종 모두 명시 허용`);

  add(text.includes("Sitemap:") ? "ok" : "warn", "robots → sitemap", text.includes("Sitemap:") ? "선언됨" : "선언 없음");
}

async function checkLlmsTxt() {
  const { status, text } = await get("/llms.txt");
  if (status !== 200) return add("warn", "llms.txt", `응답 ${status} (필수는 아니지만 Perplexity 가 참고)`);

  const want: [string, RegExp][] = [
    ["주소", /성수동|성동구|Seongsu/i],
    ["영업시간", /\d{1,2}:\d{2}|영업|hours/i],
    ["예약 경로", /예약|booking|kakao/i],
  ];
  const missing = want.filter(([, re]) => !re.test(text)).map(([k]) => k);
  if (missing.length) add("warn", "llms.txt", `빠진 항목: ${missing.join(", ")}`);
  else add("ok", "llms.txt", `${text.split("\n").length}줄, 핵심 정보 포함`);
}

async function checkSitemap() {
  const { status, text } = await get("/sitemap.xml");
  if (status !== 200) return add("fail", "sitemap.xml", `응답 ${status}`);
  const count = (text.match(/<loc>/g) ?? []).length;
  add(count > 0 ? "ok" : "fail", "sitemap.xml", `URL ${count}개`);
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed: unknown = JSON.parse(m[1]);
      for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
        if (item && typeof item === "object") out.push(item as Record<string, unknown>);
      }
    } catch {
      out.push({ "@type": "PARSE_ERROR" });
    }
  }
  return out;
}

async function checkPage(locale: string) {
  const { status, text: html } = await get(`/${locale}`);
  if (status !== 200) return add("fail", `/${locale}`, `응답 ${status}`);

  const ld = extractJsonLd(html);
  if (ld.some((x) => x["@type"] === "PARSE_ERROR")) add("fail", `/${locale} JSON-LD`, "파싱 실패한 블록 있음");

  const types = new Set(ld.map((x) => String(x["@type"] ?? "")));
  const missing = REQUIRED_LD.filter((t) => !types.has(t));
  if (!hasLocalBusiness(ld)) missing.push("지역 업체 정보(주소·영업시간)");
  add(
    missing.length ? "warn" : "ok",
    `/${locale} JSON-LD`,
    missing.length ? `없음: ${missing.join(", ")}` : `${types.size}종 (${[...types].join(", ")})`,
  );

  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "";
  add(
    desc.length >= 50 && desc.length <= 200 ? "ok" : "warn",
    `/${locale} description`,
    desc ? `${desc.length}자` : "없음",
  );

  const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
  add(canonical ? "ok" : "warn", `/${locale} canonical`, canonical ?? "없음");

  // ⚠️ Next.js 는 소스에 `hrefLang`(대문자 L)으로 렌더한다 — 대소문자를 무시해야 잡힌다
  const hreflang = (html.match(/hreflang="/gi) ?? []).length;
  add(hreflang >= 4 ? "ok" : "warn", `/${locale} hreflang`, `${hreflang}개`);

  // FAQ — AI 는 답의 첫 문장을 인용한다. 질문을 되풀이하며 시작하면 인용 가치가 떨어진다.
  const faq = ld.find((x) => x["@type"] === "FAQPage");
  if (faq) {
    const items = (faq.mainEntity as { name?: string; acceptedAnswer?: { text?: string } }[]) ?? [];
    const longOpeners = items.filter((it) => {
      const first = (it.acceptedAnswer?.text ?? "").split(/(?<=[.。!?！？])\s*/)[0] ?? "";
      return first.length > 90; // 첫 문장이 길면 직답이 아니라 설명으로 시작한 것
    });
    add(
      longOpeners.length ? "warn" : "ok",
      `/${locale} FAQ 직답`,
      longOpeners.length
        ? `${items.length}문항 중 ${longOpeners.length}개가 긴 문장으로 시작`
        : `${items.length}문항 모두 짧은 직답으로 시작`,
    );
  }
}

async function main() {
  console.log(`\nGEO 점검 — ${BASE}\n${"─".repeat(60)}`);

  await checkRobots();
  await checkLlmsTxt();
  await checkSitemap();
  for (const locale of ["ko", "en", "ja", "zh"]) await checkPage(locale);

  const icon = { ok: "✓", warn: "!", fail: "✗" } as const;
  for (const r of rows) console.log(`${icon[r.level]}  ${r.label.padEnd(22)} ${r.detail}`);

  const fails = rows.filter((r) => r.level === "fail").length;
  const warns = rows.filter((r) => r.level === "warn").length;
  console.log(`${"─".repeat(60)}\n실패 ${fails} · 주의 ${warns} · 통과 ${rows.length - fails - warns}\n`);

  if (fails) process.exitCode = 1;
}

void main();
