"use client";

import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";

type Strings = Dictionary["booking"];

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "done" }
  | { state: "error"; message: string };

/**
 * 예약 신청서 — 선택한 일정 + 이름·연락처·요청사항.
 * 보내면 서버가 시간을 다시 확인하고 스튜디오 캘린더에 "승인 대기"로 넣는다.
 *
 * 선택이 바뀌면(상품·날짜·시간) 부모가 key 를 바꿔 이 컴포넌트를 새로 만든다 —
 * "완료" 화면이 다른 일정에 남아 있지 않게.
 */
export function BookingRequestForm({
  strings: t,
  productId,
  date,
  time,
  summary,
  lang,
  privacyHref,
  onTaken,
}: {
  strings: Strings;
  productId: string;
  date: string;
  time: string;
  /** "1시간 촬영 · 10월 20일 (화) 14:00" 같은 사람용 요약 */
  summary: string;
  lang: string;
  privacyHref: string;
  /** 그 사이 시간이 찼을 때 — 부모가 빈 시간을 다시 불러온다 */
  onTaken: () => void;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status.state === "sending") return;
    const form = new FormData(e.currentTarget);
    setStatus({ state: "sending" });
    try {
      const res = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productId,
          date,
          time,
          name: form.get("name"),
          phone: form.get("phone"),
          memo: form.get("memo"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
          lang,
        }),
      });
      if (res.ok) {
        setStatus({ state: "done" });
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (data?.error === "taken") {
        setStatus({ state: "error", message: t.errorTaken });
        onTaken();
      } else if (data?.error === "invalid") {
        setStatus({ state: "error", message: t.errorInvalid });
      } else if (data?.error === "rate-limited") {
        setStatus({ state: "error", message: t.errorRate });
      } else {
        setStatus({ state: "error", message: t.errorGeneric });
      }
    } catch {
      setStatus({ state: "error", message: t.errorGeneric });
    }
  }

  if (status.state === "done") {
    return (
      <section aria-live="polite" className="rounded-2xl bg-ink-900 p-6 text-ivory-50 sm:p-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-clay-400">{t.doneEyebrow}</h2>
        <p className="mt-3 font-serif text-lg font-bold">{t.doneTitle}</p>
        <p className="mt-2 text-sm text-ivory-200/85">{summary}</p>
        <p className="mt-4 text-sm leading-relaxed text-ivory-200/85">{t.doneBody}</p>
      </section>
    );
  }

  const field =
    "mt-2 w-full rounded-lg border border-ink-600 bg-ink-800 px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-300/50 focus:border-clay-400 focus:outline-none";

  return (
    <form
      onSubmit={submit}
      aria-labelledby="book-request"
      className="relative rounded-2xl bg-ink-900 p-6 text-ivory-50 sm:p-8"
    >
      <h2 id="book-request" className="text-xs font-medium uppercase tracking-[0.2em] text-clay-400">
        4 · {t.stepRequest}
      </h2>
      <p className="mt-3 font-serif text-lg font-bold">{summary}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          {t.nameLabel}
          <input name="name" required maxLength={40} autoComplete="name" className={field} />
        </label>
        <label className="block text-sm">
          {t.phoneLabel}
          <input
            name="phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={24}
            // 브라우저는 pattern 을 v 플래그 정규식으로 해석한다 — 문자 집합 안의 ( ) - 는 이스케이프해야
            // 한다. 안 하면 "잘못된 정규식"으로 검사가 통째로 꺼진다(콘솔 에러만 남음, 실측).
            pattern="[0-9+\(\)\s\-]{8,24}"
            placeholder={t.phonePlaceholder}
            className={field}
          />
        </label>
      </div>

      <label className="mt-5 block text-sm">
        {t.memoLabel}
        <textarea name="memo" rows={3} maxLength={500} placeholder={t.memoPlaceholder} className={field} />
      </label>

      {/* 봇 함정 — 화면과 보조기기 모두에서 숨긴다. 사람은 채울 수 없다. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm text-ivory-200/90">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-clay-500" />
        <span>
          {t.consentLabel}{" "}
          <a href={privacyHref} target="_blank" className="text-clay-400 underline underline-offset-4">
            {t.consentLink}
          </a>
        </span>
      </label>

      <p className="mt-5 text-xs leading-relaxed text-ivory-300/70">{t.requestNote}</p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={status.state === "sending"}
          className="rounded-full bg-ivory-50 px-7 py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-clay-500 hover:text-ivory-50 disabled:opacity-60"
        >
          {status.state === "sending" ? t.sending : t.submit}
        </button>
        <p aria-live="polite" className="text-sm text-clay-400">
          {status.state === "error" ? status.message : ""}
        </p>
      </div>
    </form>
  );
}
