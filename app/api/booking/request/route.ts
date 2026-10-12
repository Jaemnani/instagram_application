import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { getAvailability } from "@/lib/booking/availability";
import { bookingRequestsEnabled, createAppleEvent } from "@/lib/booking/icloud";
import { parseRequest, requestToIcs } from "@/lib/booking/request";

export const dynamic = "force-dynamic";

/** 같은 곳에서 짧은 시간에 너무 많이 보내면 막는다 (봇·실수 연타 방지) */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
// 서버리스 인스턴스마다 따로라 완벽하진 않다 — 최종 관문은 사장님 승인이다
const recent = new Map<string, number[]>();

function rateLimited(key: string, now: number): boolean {
  const hits = (recent.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    recent.set(key, hits);
    return true;
  }
  hits.push(now);
  recent.set(key, hits);
  if (recent.size > 5000) recent.clear(); // 메모리가 끝없이 늘지 않게
  return false;
}

/**
 * POST /api/booking/request — 홈페이지 예약 신청.
 *
 * 1) 입력 검증 → 2) 그 시간이 아직 비어 있는지 모든 캘린더를 새로 읽어 재확인
 * → 3) 애플 "예약" 캘린더에 "[대기]" 일정 생성. 사장님 승인 전까지는 확정이 아니다.
 *
 * 응답에는 손님이 보낸 값을 되돌려주지 않는다(로그에도 이름·연락처를 남기지 않는다).
 */
export async function POST(req: NextRequest) {
  if (!bookingRequestsEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);

  // 봇 함정 칸 — 사람에게는 안 보이는 입력칸이 채워져 있으면 봇이다.
  // 성공처럼 응답해 봇이 다른 방법을 찾지 않게 한다.
  if (body && typeof body === "object" && typeof (body as Record<string, unknown>).website === "string" && (body as Record<string, string>).website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const now = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip, now)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const parsed = parseRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid", field: parsed.field }, { status: 400 });
  }
  const r = parsed.request;

  try {
    // 화면을 띄운 뒤 다른 채널에서 예약이 들어왔을 수 있다 — 캐시 없이 다시 읽는다
    const availability = await getAvailability({ product: r.product, from: r.date, days: 1, fresh: true });
    if (!availability.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    const starts = availability.days[0]?.starts ?? [];
    if (!starts.includes(r.time)) {
      return NextResponse.json({ error: "taken" }, { status: 409 });
    }

    const uid = `${randomUUID()}@kidding.kr`;
    await createAppleEvent(uid, requestToIcs(r, { uid, now, degraded: availability.degraded }));

    console.info(`[booking] 신청 저장: ${r.date} ${r.time} ${r.product.id}${availability.degraded ? " (일부 채널 미확인)" : ""}`);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[booking] 신청 저장 실패", (err as Error).message);
    return NextResponse.json({ error: "save-failed" }, { status: 502 });
  }
}
