import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { syncInstagram } from "@/lib/instagram/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * 주기 동기화 엔드포인트 (Vercel Cron / 외부 스케줄러가 호출).
 * 보호: SYNC_SECRET 환경변수와 일치하는 토큰 필요.
 *   GET /api/sync?secret=...   또는   Authorization: Bearer <secret>
 *
 * 주의: 서버리스(읽기전용 FS)에서는 이미지 자체 호스팅이 영구 저장되지 않는다.
 *   - 영구 서버(Node host)에서 동작하거나,
 *   - 서버리스라면 이미지를 Blob 스토리지로 보내거나 빌드 재배포(deploy hook)로 처리할 것.
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

export const GET = handle;
export const POST = handle;
