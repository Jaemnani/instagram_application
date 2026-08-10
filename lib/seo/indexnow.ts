import { siteConfig } from "@/lib/config";

/**
 * IndexNow — 새 URL 을 Bing·Yandex·Naver 색인에 즉시 밀어넣는다.
 *
 * GEO 관점에서 중요한 이유: ChatGPT 검색이 Bing 인덱스 위에서 돈다. 신규 도메인은
 * 자연 크롤링만 기다리면 발견까지 수 주가 걸리는데, IndexNow 는 웹마스터 도구 인증
 * 없이 키 파일 소유 증명만으로 색인을 요청할 수 있다.
 *
 * 참여 엔진끼리 제출을 공유하므로 한 엔드포인트에만 보내면 된다.
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";

/** 키를 노출하는 경로. proxy matcher 가 확장자 있는 경로를 제외하므로 언어 접두사가 안 붙는다. */
export const KEY_PATH = "/indexnow-key.txt";

export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  // 규격: 8~128자, 16진수. 형식이 어긋나면 엔진이 422 로 거절한다.
  return key && /^[a-f0-9]{8,128}$/i.test(key) ? key : null;
}

export interface SubmitResult {
  ok: boolean;
  status: number;
  submitted: number;
  message: string;
}

/**
 * URL 목록을 제출한다. 한 번에 10,000개까지, 전부 같은 호스트여야 한다.
 * 키가 없으면 조용히 건너뛴다 — 색인 제출 실패가 배포·동기화를 막으면 안 된다.
 */
export async function submitToIndexNow(urls: string[]): Promise<SubmitResult> {
  const key = indexNowKey();
  if (!key) {
    return { ok: false, status: 0, submitted: 0, message: "INDEXNOW_KEY 미설정 — 건너뜀" };
  }

  const host = new URL(siteConfig.url).host;
  // 다른 호스트가 섞이면 전체가 거절된다(422).
  const urlList = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });

  if (!urlList.length) {
    return { ok: false, status: 0, submitted: 0, message: "제출할 URL 없음" };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${siteConfig.url}${KEY_PATH}`,
      urlList: urlList.slice(0, 10_000),
    }),
  });

  // 200 = 수락, 202 = 수락했으나 키 검증 대기. 둘 다 성공으로 본다.
  const ok = res.status === 200 || res.status === 202;
  return {
    ok,
    status: res.status,
    submitted: ok ? urlList.length : 0,
    message: ok
      ? res.status === 202
        ? "수락됨 (키 검증 대기)"
        : "수락됨"
      : (await res.text()).slice(0, 200) || `HTTP ${res.status}`,
  };
}
