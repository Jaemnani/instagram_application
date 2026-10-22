import { NextResponse, type NextRequest } from "next/server";

import { getAvailability } from "@/lib/booking/availability";
import { bookingRules, findProduct } from "@/lib/booking/config";
import { bookingRequestsEnabled } from "@/lib/booking/icloud";
import { addDays, isDateString, kstDateOf } from "@/lib/booking/time";

/** 한 번에 조회할 수 있는 최대 일수 — 달력 한 달(최대 6주) */
const MAX_DAYS = 42;

/**
 * GET /api/booking/availability?product=1h&from=2026-10-01&days=31
 *
 * 응답에는 "언제 비는지"만 담는다. 다른 플랫폼 일정의 제목·출처는 노출하지 않는다.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const product = findProduct(sp.get("product"));
  const from = sp.get("from") ?? "";
  const days = Number(sp.get("days") ?? "31");

  if (!product) return NextResponse.json({ error: "unknown-product" }, { status: 400 });
  if (!isDateString(from)) return NextResponse.json({ error: "bad-date" }, { status: 400 });
  if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    return NextResponse.json({ error: "bad-days" }, { status: 400 });
  }
  // 예약을 받는 기간 밖 날짜는 받지 않는다 — 공개 API 라 터무니없는 날짜로 서버를 괴롭힐 수 있다(Codex P1)
  const today = kstDateOf(Date.now());
  if (from < addDays(today, -1) || from > addDays(today, bookingRules.maxDaysAhead)) {
    return NextResponse.json({ error: "out-of-range" }, { status: 400 });
  }

  try {
    const result = await getAvailability({ product, from, days });
    if (!result.ok) {
      // 영업시간 설정이 없거나 틀리면 잘못된 시간에 예약을 받느니 닫는다
      console.error("[booking] 영업시간(BOOKING_HOURS/BIZ_HOURS)을 해석하지 못해 예약을 열지 않음");
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    // 손님을 네이버로 바로 보내는 방식(신청서 꺼짐)에는 승인 단계가 없다. 캘린더 하나라도 못 읽었으면
    // 그 채널 예약이 빠진 "빈 시간"을 보여주게 되고, 손님은 그대로 네이버에서 예약해 겹친다(Codex P1).
    // → 일부만 보이는 대신 닫는다. 신청서 방식은 사장님 승인이 최종 관문이라 경고와 함께 연다.
    if (result.degraded && !bookingRequestsEnabled()) {
      console.error("[booking] 일부 캘린더를 읽지 못해 빈 시간을 닫음 (네이버 직접 예약 모드)");
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      {
        days: result.days,
        degraded: result.degraded,
        rules: { bufferMinutes: bookingRules.bufferMinutes, minLeadHours: bookingRules.minLeadHours },
      },
      // 빈 시간은 수시로 바뀐다. 브라우저·CDN 에 남기지 않는다.
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[booking] 빈 시간 계산 실패", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
