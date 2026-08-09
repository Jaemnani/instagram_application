import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-clay-500">404</p>
      <h1 className="mt-4 font-serif text-3xl font-bold text-ink-900">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-600">
        주소가 잘못되었거나, 게시물이 삭제·변경되었을 수 있습니다.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-block rounded-full bg-ink-900 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-clay-600"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
