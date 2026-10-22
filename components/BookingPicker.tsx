"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { BookingRequestForm } from "@/components/BookingRequestForm";
import type { Dictionary } from "@/lib/i18n";
import { addDays, kstDateOf, kstWeekday } from "@/lib/booking/time";

type ProductOption = { id: string; minutes: number; name: string };
type DayAvailability = { date: string; starts: string[] };

type Props = {
  /** 날짜 표기용 BCP-47 언어 코드 (ko-KR 등) */
  htmlLang: string;
  strings: Dictionary["booking"];
  products: ProductOption[];
  /** 카카오톡 채널 등 문의 링크. 없으면 문구 복사만 보여준다. */
  inquiryUrl: string;
  /**
   * 네이버 예약 페이지. 있으면 시간을 고른 뒤 "네이버에서 예약하기"로 보낸다 — 손님은 네이버에서
   * 직접 예약하고, 이 화면은 모든 채널을 합친 빈 시간을 미리 보여주는 역할을 한다.
   */
  naverUrl: string;
  /**
   * 홈페이지에서 직접 신청을 받을지 (서버에 애플 예약 캘린더가 설정돼 있을 때만 true).
   * false 면 지금처럼 카카오톡 문의로 안내한다.
   */
  requestsEnabled: boolean;
  /** 사이트 언어 코드 (ko/en/ja/zh) — 신청 일정에 손님 언어를 남긴다 */
  lang: string;
  privacyHref: string;
  /** 며칠 앞까지 예약을 받는지 (서버 bookingRules 와 같은 값) */
  maxDaysAhead: number;
};

type Load =
  | { state: "loading" }
  | { state: "error"; unavailable: boolean }
  | {
      state: "ready";
      days: DayAvailability[];
      degraded: boolean;
      rules: { bufferMinutes: number; minLeadHours: number };
    };

/** "{n}" 자리표시자 치환 — 사전에 함수를 넣을 수 없어서 쓰는 방식 */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));
}

/** 달의 첫날 "YYYY-MM-01" */
function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function shiftMonth(first: string, delta: number): string {
  const [y, m] = first.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

function daysInMonth(first: string): number {
  const [y, m] = first.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * 예약 선택기 — 상품 → 날짜 → 시작 시간.
 *
 * 날짜는 손님의 기기 시간대와 무관하게 **스튜디오(한국) 날짜**로 다룬다.
 * 외국인 손님의 브라우저가 다른 시간대여도 달력이 하루 밀리지 않도록
 * Date 의 로컬 getter 를 쓰지 않고 lib/booking/time 의 KST 산술만 쓴다.
 */
export function BookingPicker(props: Props) {
  // "오늘"은 브라우저에서만 정한다. 페이지는 빌드 때 정적으로 구워지므로 서버 값을 쓰면
  // 빌드한 날짜가 박히고 하이드레이션도 어긋난다. 서버 렌더에서는 null → 로딩 표시.
  const today = useSyncExternalStore(
    noopSubscribe,
    () => kstDateOf(Date.now()),
    () => null,
  );
  if (!today) {
    return <p className="mt-10 text-sm text-ink-600">{props.strings.loading}</p>;
  }
  return <Picker {...props} today={today} />;
}

function noopSubscribe() {
  return () => {};
}

function Picker({ htmlLang, strings: t, products, inquiryUrl, naverUrl, requestsEnabled, lang, privacyHref, maxDaysAhead, today }: Props & { today: string }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  // 오늘은 리드타임 때문에 대개 막혀 있으므로 내일이 속한 달부터 연다 (말일에 빈 달이 먼저 보이지 않게)
  const [month, setMonth] = useState(() => monthStart(addDays(today, 1)));
  const [reloadKey, setReloadKey] = useState(0);
  // 응답은 요청 키와 함께 저장한다. 키가 현재 선택과 다르면 = 아직 로딩 중.
  // (effect 안에서 "로딩 중"으로 되돌리는 setState 를 하지 않기 위한 구조)
  const [result, setResult] = useState<{ key: string; load: Load } | null>(null);
  const [date, setDate] = useState<string | null>(null);
  // 시간 선택은 (상품, 날짜) 에 묶는다 — 둘 중 하나가 바뀌면 자동으로 풀린다
  const [picked, setPicked] = useState<{ key: string; time: string } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId);
  const requestKey = `${productId}|${month}|${reloadKey}`;
  const load: Load = useMemo(
    () => (result?.key === requestKey ? result.load : { state: "loading" }),
    [result, requestKey],
  );

  useEffect(() => {
    // 늦게 도착한 이전 요청 응답은 키가 달라 화면에 쓰이지 않는다
    const controller = new AbortController();
    const from = month < today ? today : month;
    const days = daysInMonth(month) - (Number(from.slice(8)) - 1);
    const qs = new URLSearchParams({ product: productId, from, days: String(days) });
    const key = `${productId}|${month}|${reloadKey}`;

    fetch(`/api/booking/availability?${qs}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          setResult({ key, load: { state: "error", unavailable: res.status === 503 } });
          return;
        }
        setResult({ key, load: { state: "ready", days: data.days, degraded: data.degraded, rules: data.rules } });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, load: { state: "error", unavailable: false } });
      });
    return () => controller.abort();
  }, [productId, month, today, reloadKey]);

  const byDate = useMemo(() => {
    const map = new Map<string, string[]>();
    if (load.state === "ready") for (const d of load.days) map.set(d.date, d.starts);
    return map;
  }, [load]);

  // 상품을 바꿔 고른 날짜가 막혔으면 선택을 없는 것으로 본다(로딩 중엔 유지)
  const activeDate = date && (load.state !== "ready" || (byDate.get(date)?.length ?? 0) > 0) ? date : null;
  // 고른 시간이 최신 빈 시간 목록에 아직 있어야 한다 — "방금 마감"으로 목록을 다시 받았는데 선택이
  // 남아 있으면 마감된 시간으로 신청서가 그대로 보인다(Codex P2). 로딩 중엔 선택을 유지한다.
  const time =
    activeDate &&
    picked?.key === `${productId}|${activeDate}` &&
    (load.state !== "ready" || (byDate.get(activeDate) ?? []).includes(picked.time))
      ? picked.time
      : null;
  const setTime = (t: string) => activeDate && setPicked({ key: `${productId}|${activeDate}`, time: t });

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(htmlLang, { year: "numeric", month: "long", timeZone: "UTC" }).format(
        new Date(`${month}T00:00:00Z`),
      ),
    [htmlLang, month],
  );

  const formatDate = useCallback(
    (d: string) =>
      new Intl.DateTimeFormat(htmlLang, { month: "long", day: "numeric", weekday: "short", timeZone: "UTC" }).format(
        new Date(`${d}T00:00:00Z`),
      ),
    [htmlLang],
  );

  const cells = useMemo(() => {
    const lead = kstWeekday(month);
    const n = daysInMonth(month);
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: n }, (_, i) => addDays(month, i)),
    ];
  }, [month]);

  const canGoBack = month > monthStart(today);
  // 예약을 받는 마지막 날이 든 달까지만 넘긴다 — 그 뒤는 서버가 받지 않는다(Codex P3)
  const canGoForward = month < monthStart(addDays(today, maxDaysAhead));
  const message =
    product && activeDate && time
      ? fill(t.message, { product: product.name, date: formatDate(activeDate), time })
      : "";
  const copied = copiedMessage === message;

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(message);
    } catch {
      // 클립보드 권한이 없으면 문구가 화면에 그대로 있으니 손으로 복사할 수 있다
      setCopiedMessage(null);
    }
  }

  const monthHasSlots = load.state === "ready" && load.days.some((d) => d.starts.length > 0);

  return (
    <div className="mt-10 space-y-10">
      {/* 1. 상품 */}
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-[0.2em] text-clay-600">1 · {t.stepProduct}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {products.map((p) => (
            <label
              key={p.id}
              className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm transition-colors ${
                p.id === productId
                  ? "border-ink-900 bg-ink-900 text-ivory-50"
                  : "border-ivory-300 bg-ivory-50 text-ink-800 hover:border-ink-800"
              }`}
            >
              <input
                type="radio"
                name="product"
                value={p.id}
                checked={p.id === productId}
                onChange={() => setProductId(p.id)}
                className="sr-only"
              />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. 날짜 */}
      <section aria-labelledby="book-date">
        <div className="flex items-center justify-between">
          <h2 id="book-date" className="text-xs font-medium uppercase tracking-[0.2em] text-clay-600">
            2 · {t.stepDate}
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMonth(shiftMonth(month, -1));
                setDate(null);
              }}
              disabled={!canGoBack}
              aria-label={t.prevMonth}
              className="rounded-full px-3 py-1 text-lg text-ink-800 transition-colors hover:bg-ivory-200 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ‹
            </button>
            <span className="min-w-28 text-center font-serif text-base font-bold text-ink-900" aria-live="polite">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => {
                setMonth(shiftMonth(month, 1));
                setDate(null);
              }}
              disabled={!canGoForward}
              aria-label={t.nextMonth}
              className="rounded-full px-3 py-1 text-lg text-ink-800 transition-colors hover:bg-ivory-200 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center" role="grid" aria-busy={load.state === "loading"}>
          {t.weekdays.map((w, i) => (
            <div
              key={w}
              role="columnheader"
              className={`pb-2 text-xs ${i === 0 ? "text-clay-600" : "text-ink-600"}`}
            >
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`blank-${i}`} aria-hidden="true" />;
            const open = (byDate.get(d)?.length ?? 0) > 0;
            const selected = d === activeDate;
            return (
              <button
                key={d}
                type="button"
                role="gridcell"
                disabled={!open}
                aria-selected={selected}
                aria-label={formatDate(d)}
                onClick={() => setDate(d)}
                className={`h-10 rounded-lg text-sm transition-colors sm:h-11 ${
                  selected
                    ? "bg-ink-900 font-bold text-ivory-50"
                    : open
                      ? "bg-ivory-100 font-medium text-ink-900 hover:bg-clay-500 hover:text-ivory-50"
                      : "text-ink-400/60"
                } ${d === today && !selected ? "ring-1 ring-clay-500" : ""}`}
              >
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>

        <div className="mt-4 min-h-6 text-sm" aria-live="polite">
          {load.state === "loading" && <p className="text-ink-600">{t.loading}</p>}
          {load.state === "error" && (
            <p className="text-ink-800">
              {load.unavailable ? t.unavailable : t.error}{" "}
              {!load.unavailable && (
                <button
                  type="button"
                  onClick={() => setReloadKey((k) => k + 1)}
                  className="font-medium text-clay-600 underline underline-offset-4"
                >
                  {t.retry}
                </button>
              )}
            </p>
          )}
          {load.state === "ready" && !monthHasSlots && <p className="text-ink-600">{t.noSlotsMonth}</p>}
          {load.state === "ready" && load.degraded && <p className="mt-2 text-clay-600">{t.degraded}</p>}
        </div>
      </section>

      {/* 3. 시간 */}
      <section aria-labelledby="book-time">
        <h2 id="book-time" className="text-xs font-medium uppercase tracking-[0.2em] text-clay-600">
          3 · {t.stepTime}
        </h2>
        {!activeDate ? (
          <p className="mt-3 text-sm text-ink-600">{t.pickDate}</p>
        ) : (
          <>
            <p className="mt-3 font-serif text-base font-bold text-ink-900">{formatDate(activeDate)}</p>
            {load.state !== "ready" ? null : (byDate.get(activeDate) ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">{t.noSlotsDay}</p>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {(byDate.get(activeDate) ?? []).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={s === time}
                    onClick={() => setTime(s)}
                    className={`rounded-lg border py-2 text-sm tabular-nums transition-colors ${
                      s === time
                        ? "border-ink-900 bg-ink-900 text-ivory-50"
                        : "border-ivory-300 bg-ivory-50 text-ink-800 hover:border-ink-800"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {load.state === "ready" && (
          <p className="mt-4 text-xs leading-relaxed text-ink-600">
            {fill(t.rulesNote, { buffer: load.rules.bufferMinutes, lead: load.rules.minLeadHours })}
          </p>
        )}
      </section>

      {/* 4. 신청 — 애플 예약 캘린더가 설정돼 있으면 사이트에서 바로, 아니면 카카오톡 문의 */}
      {requestsEnabled && product && activeDate && time && (
        <BookingRequestForm
          // 일정을 바꾸면 새 신청서 — "완료" 화면이 다른 일정에 남지 않게
          key={`${product.id}|${activeDate}|${time}`}
          strings={t}
          productId={product.id}
          date={activeDate}
          time={time}
          summary={`${product.name} · ${formatDate(activeDate)} ${time}`}
          lang={lang}
          privacyHref={privacyHref}
          onTaken={() => setReloadKey((k) => k + 1)}
        />
      )}
      {!requestsEnabled && message && (
        <section aria-labelledby="book-summary" className="rounded-2xl bg-ink-900 p-6 text-ivory-50 sm:p-8">
          <h2 id="book-summary" className="text-xs font-medium uppercase tracking-[0.2em] text-clay-400">
            {t.summary}
          </h2>
          <p className="mt-3 font-serif text-lg font-bold">{message}</p>
          <p className="mt-3 text-sm text-ivory-200/85">{naverUrl ? t.naverHint : t.inquireHint}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {naverUrl && (
              <a
                href={naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-ivory-50 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-clay-500 hover:text-ivory-50"
              >
                {t.naverCta}
              </a>
            )}
            <button
              type="button"
              onClick={copyMessage}
              className="rounded-full border border-ivory-200/40 px-6 py-3 text-sm font-medium transition-colors hover:bg-ivory-50 hover:text-ink-900"
            >
              {copied ? t.copied : t.copy}
            </button>
            {inquiryUrl && (
              <a
                href={inquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={copyMessage}
                className={
                  naverUrl
                    ? "rounded-full border border-ivory-200/40 px-6 py-3 text-sm font-medium transition-colors hover:bg-ivory-50 hover:text-ink-900"
                    : "rounded-full bg-ivory-50 px-6 py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-clay-500 hover:text-ivory-50"
                }
              >
                {t.inquireCta}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
