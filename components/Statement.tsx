import { MarqueeRibbon } from "@/components/MarqueeRibbon";
import { StatementFill } from "@/components/StatementFill";
import { intlLocale, type Dictionary, type Locale } from "@/lib/i18n";

/**
 * 브랜드 스테이트먼트 — 한 화면을 통째로 쓰는 큰 문장.
 * 장면에 들어서면 문장이 앞에서부터 한 단어씩 진해진다(StatementFill).
 *
 * 분절은 서버에서 Intl.Segmenter 로 한다. 공백·문장부호 세그먼트는 span 으로 감싸지
 * 않고 텍스트 노드 그대로 내보내므로, 서버 HTML 의 텍스트는 원문과 완전히 동일하다
 * (크롤러는 평범한 문장을 읽는다). ja/zh 처럼 띄어쓰기가 없는 언어도 Segmenter 가
 * 단어 경계를 찾아준다.
 *
 * 채움 효과는 클라이언트 래퍼(StatementFill)가 data 속성으로만 제어한다 —
 * JS 미실행·reduced-motion 환경에서는 처음부터 완성된 진한 텍스트로 보인다.
 */
export function Statement({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const segmenter = new Intl.Segmenter(intlLocale[lang], { granularity: "word" });

  return (
    <section
      id="statement"
      aria-label={dict.statement.label}
      className="snap-page dot-grid relative flex min-h-svh flex-col justify-center overflow-hidden bg-ivory-50"
    >
      {/* 히어로에서 넘어온 직후, 이 장면 머리에 걸리는 브랜드 띠 */}
      <div className="absolute inset-x-0 top-0">
        <MarqueeRibbon />
      </div>

      {/* 오른쪽 여백을 채우는 세로쓰기 대형 아웃라인 (장식) */}
      <span
        aria-hidden="true"
        className="section-display vertical-label pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none font-brand font-bold uppercase leading-none xl:block"
      >
        Philosophy
      </span>
      <div className="mx-auto w-full max-w-4xl px-5 py-24 sm:px-8">
        <StatementFill>
          {dict.statement.lines.map((line, li) => (
            <p
              key={li}
              className="font-serif font-bold leading-[1.35] text-ink-900"
              style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
            >
              {[...segmenter.segment(line)].map((seg, si) => {
                if (!seg.isWordLike) return seg.segment;
                // 첫 줄의 "Kidding"만 테라코타 액센트 + 채워질 때 그려지는 낙서 밑줄.
                const accent = li === 0 && seg.segment === "Kidding";
                return (
                  <span
                    key={si}
                    className={`statement-word ${accent ? "statement-word-accent relative inline-block" : ""}`}
                  >
                    {seg.segment}
                    {accent && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 100 10"
                        preserveAspectRatio="none"
                        className="statement-squiggle"
                      >
                        <path
                          d="M2 6 Q 15 1 28 5 T 54 5 T 80 5 T 98 4"
                          pathLength="100"
                          fill="none"
                          stroke="var(--color-clay-500)"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </span>
                );
              })}
            </p>
          ))}
        </StatementFill>
      </div>
    </section>
  );
}
