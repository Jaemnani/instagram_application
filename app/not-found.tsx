import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className="text-sm font-medium text-rose-600">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-sm text-neutral-500">
        주소가 잘못되었거나, 게시물이 삭제·변경되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
