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

/**
 * 검색용 — 막히면 그 엔진 답변에 인용될 수 없다.
 * ⚠️ Google-Extended 는 여기에 넣지 않는다. 그건 Gemini **학습**용이고 검색은 Googlebot 이다.
 * 학습만 끄고 인용은 허용하는 설정(문서가 권하는 구성)을 실패로 오판하게 된다.
 */
const SEARCH_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "Googlebot",
  "Bingbot",
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

/**
 * schema.org 는 `@type` 을 문자열로도 배열로도 쓸 수 있다(`"FAQPage"` / `["FAQPage","WebPage"]`).
 * 문자열로 단정하면 배열일 때 조용히 못 찾는다 — 보증 스크립트에서는 미탐이 된다.
 */
function typesOf(node: Record<string, unknown>): string[] {
  const t = node["@type"];
  if (typeof t === "string") return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  return [];
}

/** 단일값·배열을 모두 배열로 (mainEntity 등) */
function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  return v == null ? [] : [v as T];
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

/**
 * robots.txt 를 user-agent 별 규칙으로 파싱한다(Allow/Disallow 만 본다).
 *
 * ⚠️ 그룹 규칙이 핵심이다 — **연속된 User-agent 줄은 하나의 그룹**이고 그 뒤의 규칙을
 * 함께 받는다. 규칙이 한 번 나온 뒤 다시 User-agent 가 나오면 그때부터 새 그룹이다.
 * Next 의 `MetadataRoute.Robots` 가 배열 userAgent 를 정확히 이 형태로 직렬화한다.
 * 이걸 틀리면 앞쪽 봇들이 규칙 없는 것으로 보여, 차단을 놓친다(미탐).
 */
function parseRobots(txt: string): Map<string, string[]> {
  const rules = new Map<string, string[]>();
  let group: string[] = [];
  let sawRule = false;

  for (const raw of txt.split("\n")) {
    const line = raw.split("#")[0].trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim().toLowerCase();

    if (key === "user-agent") {
      if (sawRule) {
        group = []; // 규칙 뒤에 나온 User-agent → 새 그룹
        sawRule = false;
      }
      group.push(value);
      if (!rules.has(value)) rules.set(value, []);
    } else if (key === "allow" || key === "disallow") {
      sawRule = true;
      for (const a of group) rules.get(a)?.push(`${key} ${value}`);
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
    // 규칙이 아예 없거나(미명시) 빈 그룹이면 `*` 규칙을 따르는 것으로 본다
    if (!own || own.length === 0) {
      unlisted.push(bot);
      continue;
    }
    /*
     * `Disallow: /` 만 보면 `Disallow: /*` · `Disallow: /$` 같은 전체 차단을 놓친다(미탐).
     * 반대로 같은 그룹에 Allow 가 함께 있으면 크롤러는 보통 허용 쪽을 따르므로 차단으로 보지 않는다.
     */
    const blocksAll = own.some((r) => /^disallow \/(\*|\$)?$/.test(r));
    const allowsAny = own.some((r) => r.startsWith("allow "));
    if (blocksAll && !allowsAny) blocked.push(bot);
  }

  const star = rules.get("*") ?? [];
  const starBlocksAll =
    star.some((r) => /^disallow \/(\*|\$)?$/.test(r)) && !star.some((r) => r.startsWith("allow "));

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

  /** 배열과 `@graph` 를 펼쳐 노드를 평평하게 모은다 */
  const collect = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) collect(n);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj["@graph"])) {
      for (const n of obj["@graph"]) collect(n);
      // 래퍼가 자기 타입도 가진 경우가 있어(@graph + @type 공존) 그때는 본체도 남긴다.
      // 순수 래퍼(@context + @graph 만)는 타입이 없으므로 건너뛴다.
      if (typesOf(obj).length === 0) return;
    }
    out.push(obj);
  };

  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      collect(JSON.parse(m[1]));
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
  if (ld.some((x) => typesOf(x).includes("PARSE_ERROR"))) add("fail", `/${locale} JSON-LD`, "파싱 실패한 블록 있음");

  const types = new Set(ld.flatMap(typesOf));
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
  const faq = ld.find((x) => typesOf(x).includes("FAQPage"));
  if (faq) {
    const items = asArray<{ name?: string; acceptedAnswer?: { text?: string } }>(faq.mainEntity);
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

// 보증 스크립트가 예외로 죽으면 판정 자체가 사라진다 — 실패로 명확히 알린다
void main().catch((err: unknown) => {
  console.error("\n점검 중 오류:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
