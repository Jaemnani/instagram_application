import { readFile } from "node:fs/promises";
import path from "node:path";

import "./load-env";
import { siteConfig } from "@/lib/config";
import { locales, localizedPath } from "@/lib/i18n/config";
import { KEY_PATH, indexNowKey, submitToIndexNow } from "@/lib/seo/indexnow";

/**
 * 사이트의 모든 URL 을 IndexNow 로 제출한다 — 배포 뒤에 돌린다.
 *
 *   npm run indexnow            전체 제출
 *   npm run indexnow -- --list  제출할 URL 만 출력 (호출 안 함)
 *
 * 배포 전에 돌리면 검색엔진이 옛 내용을 가져가므로 순서를 지킬 것.
 */

interface Post {
  slug: string;
}

async function collectUrls(): Promise<string[]> {
  const raw = await readFile(path.join(process.cwd(), "data", "instagram.json"), "utf8");
  const { posts } = JSON.parse(raw) as { posts: Post[] };

  const urls: string[] = [];
  for (const locale of locales) {
    urls.push(`${siteConfig.url}${localizedPath(locale)}`);
    urls.push(`${siteConfig.url}${localizedPath(locale, "/privacy")}`);
    for (const p of posts) {
      // 한글 슬러그는 인코딩해야 한다 — 엔진이 비ASCII 원문 URL 을 거절할 수 있다.
      urls.push(
        `${siteConfig.url}${localizedPath(locale, `/posts/${encodeURIComponent(p.slug)}`)}`,
      );
    }
  }
  return urls;
}

async function main() {
  const urls = await collectUrls();

  if (process.argv.includes("--list")) {
    urls.forEach((u) => console.log(u));
    console.log(`\n총 ${urls.length}개`);
    return;
  }

  if (!indexNowKey()) {
    console.error(
      "public/indexnow-key.txt 가 없거나 형식이 잘못됐습니다 (16진수 8~128자).\n" +
        "  생성: openssl rand -hex 32 | tr -d '\\n' > public/indexnow-key.txt",
    );
    process.exit(1);
  }

  // 키 파일이 라이브에 떠 있어야 제출이 검증된다. 먼저 확인해서 헛제출을 막는다.
  const keyUrl = `${siteConfig.url}${KEY_PATH}`;
  const check = await fetch(keyUrl).catch(() => null);
  const served = check?.ok ? (await check.text()).trim() : null;
  if (served !== indexNowKey()) {
    console.error(
      `키 파일 확인 실패: ${keyUrl}\n` +
        `  응답: ${check ? `HTTP ${check.status}` : "연결 실패"}\n` +
        "  public/indexnow-key.txt 가 배포에 포함됐는지 확인하세요.",
    );
    process.exit(1);
  }

  const result = await submitToIndexNow(urls);
  console.log(
    result.ok
      ? `✔ ${result.submitted}개 URL 제출 (HTTP ${result.status}) — ${result.message}`
      : `✘ 제출 실패 (HTTP ${result.status}) — ${result.message}`,
  );
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
