/**
 * "막힌 시간만" 담은 캘린더(.ics) — 다른 예약 플랫폼이 가져가서 그 시간을 마감하게 한다.
 * 첫 사용처: 아워플레이스 "외부 캘린더 가져오기"(10~30분 주기).
 *
 * 손님 이름·연락처·어느 채널 예약인지는 넣지 않는다. 시간만 나간다.
 */
import { foldLine, utcStamp } from "./ics";
import type { Interval } from "./time";

/** 앞뒤로 텀을 붙이고, 겹치거나 맞닿는 구간을 하나로 합친다 */
export function padAndMerge(busy: Interval[], bufferMinutes: number): Interval[] {
  const pad = bufferMinutes * 60_000;
  const sorted = busy
    .filter((b) => b.end > b.start)
    .map((b) => ({ start: b.start - pad, end: b.end + pad }))
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const b of sorted) {
    const last = out[out.length - 1];
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else out.push({ ...b });
  }
  return out;
}

export function buildBusyFeed(intervals: Interval[], opts: { now: number }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//kidding.kr//busy-feed//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:kidding 예약 마감",
  ];
  for (const b of intervals) {
    lines.push(
      "BEGIN:VEVENT",
      // 같은 구간이면 같은 UID — 가져가는 쪽이 매번 새 일정으로 쌓지 않게
      `UID:busy-${b.start}-${b.end}@kidding.kr`,
      `DTSTAMP:${utcStamp(opts.now)}`,
      `DTSTART:${utcStamp(b.start)}`,
      `DTEND:${utcStamp(b.end)}`,
      "SUMMARY:kidding 예약 마감",
      "TRANSP:OPAQUE",
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
