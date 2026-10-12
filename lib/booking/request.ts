/**
 * 예약 신청 — 입력 검증과 캘린더 일정 문구 만들기 (순수 함수, 네트워크 없음).
 * 저장과 시간 재확인은 app/api/booking/request/route.ts 가 한다.
 */
import { findProduct, type Product } from "./config";
import { buildRequestEvent } from "./ics";
import { hhmmToMinutes, isDateString, kstMidnight } from "./time";

export const LIMITS = { name: 40, memo: 500, phoneDigitsMin: 8, phoneDigitsMax: 15 } as const;

export type BookingRequest = {
  product: Product;
  date: string;
  time: string;
  name: string;
  phone: string;
  memo: string;
  lang: string;
};

export type ParseResult =
  | { ok: true; request: BookingRequest }
  | { ok: false; field: "product" | "date" | "time" | "name" | "phone" | "memo" | "consent" };

/** 제어문자 제거 + 앞뒤 공백 정리. 줄바꿈은 요청사항에서만 살린다. */
function clean(value: unknown, keepNewlines = false): string {
  if (typeof value !== "string") return "";
  const stripped = keepNewlines
    ? value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    : value.replace(/[\u0000-\u001F\u007F]/g, " ");
  return stripped.trim();
}

export function parseRequest(body: unknown): ParseResult {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const product = findProduct(typeof b.product === "string" ? b.product : null);
  if (!product) return { ok: false, field: "product" };

  const date = clean(b.date);
  if (!isDateString(date)) return { ok: false, field: "date" };

  const time = clean(b.time);
  const minutes = hhmmToMinutes(time);
  if (minutes === null || minutes % 30 !== 0) return { ok: false, field: "time" };

  const name = clean(b.name).replace(/\s+/g, " ");
  if (!name || [...name].length > LIMITS.name) return { ok: false, field: "name" };

  const phone = clean(b.phone).replace(/\s+/g, " ");
  const digits = phone.replace(/\D/g, "");
  if (!/^[+\d\s()-]+$/.test(phone) || digits.length < LIMITS.phoneDigitsMin || digits.length > LIMITS.phoneDigitsMax) {
    return { ok: false, field: "phone" };
  }

  const memo = clean(b.memo, true);
  if ([...memo].length > LIMITS.memo) return { ok: false, field: "memo" };

  // 개인정보 수집·이용 동의 — 체크 없이는 받지 않는다
  if (b.consent !== true) return { ok: false, field: "consent" };

  const lang = typeof b.lang === "string" && /^[a-z]{2}$/.test(b.lang) ? b.lang : "ko";
  return { ok: true, request: { product, date, time, name, phone, memo, lang } };
}

/** 신청한 시작~끝 시각 (밀리초, 절대 시각) */
export function requestInterval(r: Pick<BookingRequest, "date" | "time" | "product">): { start: number; end: number } {
  const start = kstMidnight(r.date) + (hhmmToMinutes(r.time) ?? 0) * 60_000;
  return { start, end: start + r.product.minutes * 60_000 };
}

const LANG_LABEL: Record<string, string> = { ko: "한국어", en: "영어", ja: "일본어", zh: "중국어" };

/**
 * 스튜디오 공유 캘린더의 제목 규칙 — "HJ <채널> <종류>" (예: "HJ 스클 대관", "HJ 네이버 kidding").
 * 홈페이지 신청은 "HJ 홈페이지 kidding", 승인 전에는 뒤에 "[대기]"가 붙는다.
 */
export const TITLE_PREFIX = "HJ 홈페이지 kidding";
export const PENDING_MARK = "[대기]";

/** 사장님이 아이폰에서 보는 일정. 제목만 봐도 상태·상품·이름이 보이게 한다. */
export function requestToIcs(r: BookingRequest, opts: { uid: string; now: number; degraded: boolean }): string {
  const { start, end } = requestInterval(r);
  const submitted = new Date(opts.now + 9 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
  const lines = [
    `⏳ 승인 대기 — 승인하면 제목의 ${PENDING_MARK}를 지우고, 거절하면 이 일정을 삭제하세요.`,
    "",
    `상품: ${r.product.name.ko}`,
    `이름: ${r.name}`,
    `연락처: ${r.phone}`,
    r.memo ? `요청사항: ${r.memo}` : "요청사항: (없음)",
    "",
    `신청: ${submitted} (홈페이지 · ${LANG_LABEL[r.lang] ?? r.lang})`,
  ];
  if (opts.degraded) {
    lines.push("⚠️ 신청 시점에 일부 예약 채널의 일정을 확인하지 못했습니다. 다른 채널과 겹치는지 확인해 주세요.");
  }
  return buildRequestEvent({
    uid: opts.uid,
    start,
    end,
    summary: `${TITLE_PREFIX} ${PENDING_MARK} ${r.product.name.ko} · ${r.name}`,
    description: lines.join("\n"),
    now: opts.now,
  });
}
