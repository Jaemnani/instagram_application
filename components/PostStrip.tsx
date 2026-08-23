import { PostCard } from "@/components/PostCard";
import { StripControls } from "@/components/StripControls";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Post } from "@/lib/instagram/types";

const STRIP_ID = "gallery-strip";

/**
 * 최근 촬영 가로 스크롤 스트립.
 *
 * "더 있다"를 알리는 장치를 세 겹으로 둔다 — 다음 카드가 잘려 보이는 peek,
 * 오른쪽 끝 그라데이션, 그리고 화살표. 자동으로 흐르게 하지 않은 이유는
 * 카드가 링크라서다: 움직이는 대상은 누르기 어렵고, 무한 루프를 만들려면
 * 목록을 복제해야 해 같은 링크가 두 번 잡힌다.
 *
 * 서버 컴포넌트로 둔다. 스크롤은 브라우저 기본 기능이라 JS 없이도 동작하고,
 * 크롤러도 카드 전부를 그대로 읽는다.
 */
export function PostStrip({
  posts,
  lang,
  dict,
  tone = "light",
}: {
  posts: Post[];
  lang: Locale;
  dict: Dictionary;
  tone?: "light" | "dark";
}) {
  if (!posts.length) return null;
  const dark = tone === "dark";

  return (
    <div className={`border-t pt-10 ${dark ? "border-ivory-50/10" : "border-ivory-200"}`}>
      {/*
        role="region" 은 바깥 div 에 준다. ul 에 주면 암묵 role(list) 이 덮여
        자식 <li> 가 "리스트 밖의 항목"이 되어 접근성 검사에 걸린다(실측).
        초점과 좌우 키 이동은 ul 이 그대로 담당한다.
      */}
      <div className="relative" role="region" aria-label={dict.gallery.title}>
        <ul
          id={STRIP_ID}
          // 목록 자체에 초점을 줘 키보드 사용자도 좌우 키로 넘길 수 있게 한다.
          tabIndex={0}
          /*
           * scroll-pl-* 은 px-* 과 반드시 같은 값이어야 한다. 없으면 snap-start 가
           * 첫 카드를 컨테이너 맨 왼쪽(= padding 안쪽)에 맞추려고 scrollLeft 을
           * padding 만큼(20/32px) 밀어놓아, 처음부터 "왼쪽 끝이 아닌" 상태가 된다
           * → 이전 화살표가 영원히 활성으로 남는다.
           */
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-pl-5 gap-6 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-pl-8 sm:px-8"
        >
          {posts.map((post) => (
            <li
              key={post.id}
              // 다음 카드가 살짝 잘려 보이도록 100% 보다 작게 — 스크롤 가능함을 즉시 알린다.
              className="w-[76%] shrink-0 snap-start sm:w-[46%] lg:w-[30%] xl:w-[23%]"
            >
              {/* 한 화면 안에 들어가야 하는 카드 — 사진 높이가 뷰포트를 따라간다 */}
              <PostCard post={post} lang={lang} dict={dict} tone={tone} compact />
            </li>
          ))}
        </ul>

        {/* 오른쪽 끝이 배경으로 사라지며 "이어진다"는 인상을 준다. 클릭은 통과시킨다. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l to-transparent sm:block ${dark ? "from-ink-900" : "from-ivory-50"}`}
        />
      </div>

      <StripControls
        targetId={STRIP_ID}
        labels={{ prev: dict.gallery.scrollPrev, next: dict.gallery.scrollNext }}
        tone={tone}
      />
    </div>
  );
}
