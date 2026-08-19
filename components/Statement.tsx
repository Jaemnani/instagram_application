import { StatementFill } from "@/components/StatementFill";
import { intlLocale, type Dictionary, type Locale } from "@/lib/i18n";

/**
 * 브랜드 스테이트먼트 — 스크롤에 따라 문장이 단어 단위로 채워지는 대형 타이포 섹션.
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
    <section id="statement" aria-label={dict.statement.label} className="bg-ivory-50">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
        <StatementFill>
          {dict.statement.lines.map((line, li) => (
            <p
              key={li}
              className="font-serif font-bold leading-[1.35] text-ink-900"
              style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
            >
              {[...segmenter.segment(line)].map((seg, si) =>
                seg.isWordLike ? (
                  <span
                    key={si}
                    className={`statement-word ${
                      // 첫 줄의 "Kidding"만 채움 완료 색을 테라코타로 — 절제된 팝 포인트.
                      li === 0 && seg.segment === "Kidding" ? "statement-word-accent" : ""
                    }`}
                  >
                    {seg.segment}
                  </span>
                ) : (
                  seg.segment
                ),
              )}
            </p>
          ))}
        </StatementFill>
      </div>
    </section>
  );
}
