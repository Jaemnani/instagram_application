import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { collectBusy } from "@/lib/booking/availability";
import { bookingRules } from "@/lib/booking/config";
import { buildBusyFeed, padAndMerge } from "@/lib/booking/feed";

export const dynamic = "force-dynamic";

/** 아워플레이스 피드 주소의 호스트 — 아워플레이스에 줄 피드에서 자기 일정은 뺀다 */
const HOURPLACE_HOST = "calendar-ics.hourplace.co.kr";
const DAY_MS = 86_400_000;
/** 얼마나 먼 미래까지 막을지 — 다른 플랫폼은 우리 예약 기간(60일)보다 멀리 받을 수 있다 */
const HORIZON_DAYS = 180;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * GET /api/booking/feed/<BOOKING_FEED_TOKEN>.ics — 막힌 시간만 담은 캘린더.
 * 아워플레이스 → 캘린더 설정 → 외부 캘린더 가져오기에 이 주소를 넣는다.
 *
 * 주소 자체가 비밀번호 역할이다(토큰이 틀리면 404). 손님 정보는 없지만 스튜디오 일정이 보이므로.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const token = process.env.BOOKING_FEED_TOKEN?.trim();
  const { file } = await params;
  if (!token || !safeEqual(file, `${token}.ics`)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const now = Date.now();
  const { busy, failed } = await collectBusy(
    { start: now - DAY_MS, end: now + HORIZON_DAYS * DAY_MS },
    { excludeHost: HOURPLACE_HOST },
  );

  // 캘린더 하나라도 못 읽었으면 일부만 담은 피드를 주지 않는다 — 막혀야 할 시간이
  // 피드에서 빠지면 가져가는 쪽이 그 시간을 "다시 열어" 겹치기 예약이 생긴다.
  // 오류를 주면 가져가는 쪽은 보통 이전 내용을 유지한다.
  if (failed.length) {
    console.error(`[booking] 막힌 시간 피드 생성 보류 — 읽지 못한 캘린더: ${failed.join(", ")}`);
    return new NextResponse("Calendar temporarily unavailable", { status: 503, headers: { "Retry-After": "600" } });
  }

  const body = buildBusyFeed(padAndMerge(busy, bookingRules.bufferMinutes), { now });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
