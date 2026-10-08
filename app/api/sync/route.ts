import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { fetchProfile } from "@/lib/instagram/client";
import { syncInstagram } from "@/lib/instagram/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * 주기 동기화 엔드포인트 (Vercel Cron / 외부 스케줄러가 호출).
 * 보호: SYNC_SECRET 환경변수와 일치하는 토큰 필요.
 *   GET /api/sync?secret=...   또는   Authorization: Bearer <secret>
 *
 * 두 가지로 동작한다.
 *   - DEPLOY_HOOK_URL 이 있으면(Vercel): 재배포만 건다. 서버리스는 파일을 저장할 수 없어
 *     여기서 받아온 사진이 남지 않는다. 대신 빌드의 prebuild(sync)가 새 게시물을 받아 굽는다.
 *   - 없으면(파일을 쓸 수 있는 Node 서버): 그 자리에서 동기화하고 페이지를 다시 만든다.
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

async function handle(req: NextRequest) {
  // Vercel Cron은 CRON_SECRET을 Authorization 헤더로 자동 전송한다.
  const secret = process.env.SYNC_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  const provided =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  // 프로덕션에서 시크릿 미설정 시 엔드포인트를 열어두지 않는다.
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "SYNC_SECRET(또는 CRON_SECRET)이 설정되지 않아 비활성화되었습니다." },
      { status: 503 },
    );
  }
  if (secret && (!provided || !safeEqual(provided, secret))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const deployHook = process.env.DEPLOY_HOOK_URL?.trim();
  if (deployHook) return triggerRedeploy(deployHook);

  try {
    const data = await syncInstagram();
    revalidatePath("/", "layout");
    return NextResponse.json({
      ok: true,
      posts: data.posts.length,
      syncedAt: data.syncedAt,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

/**
 * 재배포 전에 토큰부터 확인한다. 토큰이 죽어 있으면 빌드가 prebuild 에서 실패할 뿐
 * 사이트는 멀쩡해서(옛 배포 유지) 아무도 모른다 — 여기서 500 을 내 cron 로그에 남긴다.
 */
async function triggerRedeploy(hookUrl: string) {
  try {
    await fetchProfile();
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Instagram 토큰 확인 실패 — 재배포하지 않음: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  const res = await fetch(hookUrl, { method: "POST" }).catch((err: Error) => err);
  if (res instanceof Error || !res.ok) {
    const reason = res instanceof Error ? res.message : `HTTP ${res.status}`;
    return NextResponse.json({ ok: false, error: `재배포 요청 실패: ${reason}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, redeploy: "requested" });
}

export const GET = handle;
export const POST = handle;
