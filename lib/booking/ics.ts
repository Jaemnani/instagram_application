/**
 * 예약 신청을 캘린더 일정(.ics)으로 만든다 — RFC 5545 최소 구현.
 *
 * 시각은 전부 UTC(…Z)로 쓴다. 시간대 표기 없는(floating) 시각은 읽는 쪽 서버 시간대로
 * 해석돼 9시간 밀릴 수 있다(TOOL_GOTCHAS "node-ical floating 시각"). Z 는 어디서 읽어도 같은 순간이다.
 */

/** TEXT 값 이스케이프 (RFC 5545 §3.3.11) — 손님 입력이 줄 구조를 깨지 못하게 */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * 한 줄이 75바이트를 넘으면 접는다 (RFC 5545 §3.1). 한글은 3바이트라
 * 문자 수가 아니라 UTF-8 바이트로 세고, 글자 중간에서 자르지 않는다.
 */
export function foldLine(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch, "utf8");
    // 첫 줄은 75바이트, 이어지는 줄은 앞의 공백 1바이트를 빼고 74바이트
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function utcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export type RequestEvent = {
  uid: string;
  start: number;
  end: number;
  summary: string;
  /** 줄바꿈은 그대로 넣으면 된다 — 여기서 이스케이프한다 */
  description: string;
  now: number;
};

export function buildRequestEvent(e: RequestEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//kidding.kr//booking//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${utcStamp(e.now)}`,
    `CREATED:${utcStamp(e.now)}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${escapeText(e.summary)}`,
    `DESCRIPTION:${escapeText(e.description)}`,
    // 승인 전이지만 시간은 막아야 한다 — 같은 시간에 신청이 두 번 들어오지 않게
    "STATUS:TENTATIVE",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
