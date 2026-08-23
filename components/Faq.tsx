import type { Dictionary } from "@/lib/i18n";

/**
 * 자주 묻는 질문. <details>/<summary> 라 JS 없이 접힘이 동작하고,
 * 접힌 상태에서도 답변 텍스트가 DOM 에 있어 크롤러가 전부 읽는다.
 *
 * name 을 공유하면 브라우저가 배타 아코디언으로 다룬다(하나를 열면 나머지는 닫힘).
 * 풀페이지 스냅에서 이 장면이 한 화면을 넘기지 않게 하는 역할도 겸한다.
 * 미지원 브라우저에서는 그냥 여러 개가 열릴 뿐 동작은 그대로다.
 */
export function Faq({ dict }: { dict: Dictionary }) {
  return (
    <div className="faq-list mt-8 divide-y divide-ivory-200 border-y border-ivory-200">
      {dict.faq.items.map((f) => (
        <details key={f.q} name="faq" className="group py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
            <h3 className="font-serif text-lg font-semibold leading-snug text-ink-900">{f.q}</h3>
            <span
              aria-hidden="true"
              className="mt-1 shrink-0 text-ink-400 transition-transform group-open:rotate-45"
            >
              ＋
            </span>
          </summary>
          <p className="mt-3 max-w-3xl pr-10 text-sm leading-[1.85] text-ink-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
