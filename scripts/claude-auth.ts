import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * 로컬 Claude Code 구독 토큰으로 Anthropic API 를 부른다 — 개발자 본인 머신 전용.
 *
 * 이 토큰은 사람이 자기 구독으로 로그인해 둔 자격증명이다. 빌드 서버·CI·공유 환경에
 * 복사하지 말 것(약관 위반이자 사고 위험). 그래서 이 스크립트가 만드는 결과물은
 * data/translations.json 으로 커밋되고, Vercel 빌드는 그 파일을 읽기만 한다.
 *
 * 토큰을 갱신하지 않는 이유: refresh 는 refresh_token 을 회전시킨다. 여기서 갱신하고
 * 저장하지 않으면 Claude Code 쪽 토큰이 무효화되고, 저장하려면 비밀을 argv 로 넘겨야 해
 * `ps` 에 노출된다. 만료됐으면 Claude Code 를 한 번 쓰라고 안내하는 편이 안전하다.
 */

const KEYCHAIN_SERVICE = "Claude Code-credentials";
const CREDENTIALS_FILE = path.join(homedir(), ".claude", ".credentials.json");

export interface ClaudeAuth {
  /** 요청 헤더에 그대로 얹는다. 절대 로그로 찍지 말 것. */
  headers: Record<string, string>;
  source: "api-key" | "subscription";
}

interface OAuthCredentials {
  claudeAiOauth?: { accessToken?: string; expiresAt?: number };
}

async function readOAuthToken(): Promise<{ token: string; expiresAt?: number } | null> {
  let raw: string | null = null;

  try {
    const { stdout } = await run("security", [
      "find-generic-password",
      "-s",
      KEYCHAIN_SERVICE,
      "-a",
      process.env.USER ?? "",
      "-w",
    ]);
    raw = stdout.trim();
  } catch {
    // 키체인에 없거나(리눅스 등) 사용자가 접근을 거부함 → 파일 폴백
    try {
      raw = await readFile(CREDENTIALS_FILE, "utf8");
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(raw) as OAuthCredentials;
    const token = parsed.claudeAiOauth?.accessToken;
    return token ? { token, expiresAt: parsed.claudeAiOauth?.expiresAt } : null;
  } catch {
    return null;
  }
}

export async function getClaudeAuth(): Promise<ClaudeAuth> {
  // 명시적인 API 키가 있으면 그쪽을 쓴다 — 구독 토큰을 건드릴 이유가 없다.
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (apiKey) {
    return {
      source: "api-key",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    };
  }

  const oauth = await readOAuthToken();
  if (!oauth) {
    throw new Error(
      "Claude 자격증명을 찾지 못했습니다.\n" +
        "  · 구독으로 쓰려면: Claude Code 에 로그인되어 있어야 합니다 (`claude` 실행 후 로그인)\n" +
        "  · API 키로 쓰려면: ANTHROPIC_API_KEY 를 .env.local 에 넣으세요",
    );
  }

  if (oauth.expiresAt && oauth.expiresAt < Date.now() + 60_000) {
    throw new Error(
      "구독 토큰이 만료되었습니다.\n" +
        "  Claude Code 를 한 번 실행하면 자동으로 갱신됩니다. 그 뒤 다시 시도하세요.\n" +
        "  (이 스크립트는 토큰을 직접 갱신하지 않습니다 — refresh 토큰이 회전해\n" +
        "   Claude Code 쪽 로그인이 풀릴 수 있습니다.)",
    );
  }

  return {
    source: "subscription",
    headers: {
      Authorization: `Bearer ${oauth.token}`,
      "anthropic-version": "2023-06-01",
      // 구독 토큰은 이 두 베타 플래그가 있어야 /v1/messages 를 받아준다.
      "anthropic-beta": "claude-code-20250219,oauth-2025-04-20",
    },
  };
}

export interface MessageRequest {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}

/** Anthropic Messages API 호출 → 응답 텍스트. */
export async function callClaude(auth: ClaudeAuth, req: MessageRequest): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { ...auth.headers, "content-type": "application/json" },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      // 구독 토큰은 첫 system 블록이 정확히 이 문장이어야 400 을 안 낸다.
      system:
        auth.source === "subscription"
          ? [
              { type: "text", text: "You are Claude Code, Anthropic's official CLI for Claude." },
              { type: "text", text: req.system },
            ]
          : req.system,
      messages: [{ role: "user", content: req.user }],
    }),
  });

  if (!res.ok) {
    // 본문에 원인이 들어있다(모델명 오류 등). 토큰은 헤더에만 있으므로 안전하게 노출 가능.
    throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("응답이 비었습니다 (max_tokens 를 thinking 이 소진했을 수 있음)");
  return text;
}
