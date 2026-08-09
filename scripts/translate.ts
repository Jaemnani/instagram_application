import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { callClaude, getClaudeAuth, type ClaudeAuth } from "./claude-auth";
import "./load-env";

/**
 * 게시물 캡션을 영어·일본어·중국어로 번역해 data/translations.json 에 채운다.
 *
 * 로컬에서 사람이 돌리는 스크립트다. 결과 파일을 커밋하면 Vercel 빌드는 읽기만 하므로
 * 배포 환경에 번역용 자격증명이 필요 없다.
 *
 *   npm run translate                 아직 번역 안 된 것만
 *   npm run translate -- --force      전부 다시
 *   npm run translate -- --id=1805…   특정 게시물만
 *   npm run translate -- --dry-run    호출만 하고 저장 안 함
 */

const TARGET_LOCALES = ["en", "ja", "zh"] as const;
type Target = (typeof TARGET_LOCALES)[number];

const LOCALE_NAMES: Record<Target, string> = {
  en: "English",
  ja: "Japanese (日本語)",
  zh: "Simplified Chinese (简体中文)",
};

const DATA_FILE = path.join(process.cwd(), "data", "instagram.json");
const OUT_FILE = path.join(process.cwd(), "data", "translations.json");
const DEFAULT_MODEL = "claude-sonnet-5";

interface Post {
  id: string;
  title: string;
  caption: string;
  timestamp: string;
}

type Entry = { sourceHash?: string } & Partial<
  Record<Target, { title: string; caption: string }>
>;

const SYSTEM = `You translate Instagram captions for the multilingual website of "kidding seongsu", a baby and family photo studio in Seongsu-dong, Seoul.

The studio's voice is playful, warm and understated. It refuses posed, stiff photography — the name comes from "we're just kidding". Carry that voice across; do not make the copy sound like marketing.

For each caption produce a TITLE and a CAPTION.

CAPTION rules:
- Translate only the part that describes the photo, the studio, or the family's story.
- Remove content that does not belong on a website: dated booking announcements ("4월 예약 오픈 안내"), KakaoTalk channel handles, and instructions that only make sense inside Instagram ("프로필 하단 링크 클릭"). The website has its own booking button, and a months-old booking notice reads as stale information.
- Remove the trailing block of hashtags. The website shows hashtags separately.
- Text that is ALREADY in English stays exactly as written, character for character — including "We're just kidding", "We just KIDDING", "[ We just kidding. ]" and "KIDDING SEONGSU : OPENING SOON". Never re-translate or re-word English that the studio wrote itself.
- Keep emoji where they are.
- Keep paragraph breaks.
- Personal asides that only make sense to the writer's family may be dropped if they would read as strange out of context.
- If nothing is left after these removals, return just the English line the post already had.

TITLE rules:
- Short, descriptive, and usable as a page heading and <title>.
- If the Korean title carries a date in parentheses, localise the date to the target language.
- If the Korean title is itself a stale booking notice, title it after what the post is actually about instead.

Reply with JSON only, no prose, no code fence:
{"en":{"title":"…","caption":"…"},"ja":{"title":"…","caption":"…"},"zh":{"title":"…","caption":"…"}}`;

function captionHash(caption: string): string {
  return createHash("sha256").update(caption).digest("hex").slice(0, 16);
}

/**
 * 모델이 JSON 을 코드펜스로 감싸는 경우가 있다. 여는 펜스가 문자열 맨 앞이고 닫는 펜스가
 * 맨 뒤일 때만 한 쌍으로 벗긴다 — 한쪽만 지우면 내용이 깨진다.
 */
function stripFence(text: string): string {
  const t = text.trim();
  const open = /^```(?:json)?[ \t]*\r?\n/.exec(t);
  if (!open) return t;
  const close = /\r?\n```$/.exec(t);
  if (!close) return t;
  return t.slice(open[0].length, t.length - close[0].length).trim();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name: string) =>
    args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
  return {
    force: args.includes("--force"),
    dryRun: args.includes("--dry-run"),
    id: get("id"),
    model: get("model") ?? DEFAULT_MODEL,
  };
}

async function translatePost(
  auth: ClaudeAuth,
  model: string,
  post: Post,
): Promise<Record<Target, { title: string; caption: string }>> {
  const user = [
    `Target languages: ${TARGET_LOCALES.map((l) => `${l} = ${LOCALE_NAMES[l]}`).join(", ")}`,
    "",
    `Posted on: ${post.timestamp.slice(0, 10)}`,
    `Korean title: ${post.title}`,
    "Korean caption:",
    "---",
    post.caption,
    "---",
  ].join("\n");

  const raw = await callClaude(auth, { model, system: SYSTEM, user, maxTokens: 4096 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(raw));
  } catch {
    throw new Error(`JSON 파싱 실패. 응답 앞부분: ${raw.slice(0, 200)}`);
  }

  const out = {} as Record<Target, { title: string; caption: string }>;
  for (const locale of TARGET_LOCALES) {
    const v = (parsed as Record<string, { title?: string; caption?: string }>)[locale];
    if (!v?.title?.trim() || !v?.caption?.trim()) {
      throw new Error(`${locale} 번역이 비었습니다`);
    }
    out[locale] = { title: v.title.trim(), caption: v.caption.trim() };
  }
  return out;
}

async function main() {
  const { force, dryRun, id, model } = parseArgs();

  const { posts } = JSON.parse(await readFile(DATA_FILE, "utf8")) as { posts: Post[] };
  let cacheFile: Record<string, Entry> = {};
  try {
    cacheFile = JSON.parse(await readFile(OUT_FILE, "utf8"));
  } catch {
    /* 처음 실행 */
  }

  const targets = posts.filter((p) => {
    if (id && p.id !== id) return false;
    if (force) return true;
    const entry = cacheFile[p.id];
    if (!entry) return true;
    // 캡션이 수정됐으면 기존 번역은 원문과 어긋난다.
    if (entry.sourceHash !== captionHash(p.caption)) return true;
    return TARGET_LOCALES.some((l) => !entry[l]?.caption);
  });

  if (!targets.length) {
    console.log(`✔ 번역할 게시물이 없습니다 (전체 ${posts.length}개 최신 상태)`);
    return;
  }

  const auth = await getClaudeAuth();
  console.log(
    `${targets.length}/${posts.length}개 번역 · 모델 ${model} · 인증 ${
      auth.source === "subscription" ? "구독(로컬 전용)" : "API 키"
    }${dryRun ? " · dry-run" : ""}\n`,
  );

  let done = 0;
  const failed: string[] = [];

  for (const post of targets) {
    const label = `${post.timestamp.slice(0, 10)} ${post.title.slice(0, 28)}`;
    process.stdout.write(`  ${label} … `);
    try {
      const result = await translatePost(auth, model, post);
      cacheFile[post.id] = { sourceHash: captionHash(post.caption), ...result };
      done++;
      console.log("완료");
    } catch (err) {
      failed.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
      console.log("실패");
    }
  }

  if (!dryRun && done) {
    // 게시물 순서대로 정렬해 diff 가 뒤섞이지 않게 한다.
    const ordered: Record<string, Entry> = {};
    for (const p of posts) if (cacheFile[p.id]) ordered[p.id] = cacheFile[p.id];
    for (const k of Object.keys(cacheFile)) if (!ordered[k]) ordered[k] = cacheFile[k];
    await writeFile(OUT_FILE, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  }

  console.log(`\n${done}개 번역${dryRun ? " (저장 안 함)" : " → data/translations.json"}`);
  if (failed.length) {
    console.log(`${failed.length}개 실패:`);
    failed.forEach((f) => console.log("  · " + f));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
