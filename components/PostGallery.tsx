"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import type { SiteImage } from "@/lib/instagram/types";

/**
 * 게시물 사진 + 전체화면 뷰어(라이트박스).
 *
 * 서버에서도 그대로 렌더되므로 <img>/alt 는 HTML 에 남고 색인에 영향이 없다.
 *
 * iOS 26 Safari 주의: `position:fixed; inset:0` 에 배경색을 직접 주면 layout viewport 가
 * small 로 떨어져 하단에 띠가 생긴다. → 바깥 fixed 는 배경 없이 짧게 두고,
 * 안쪽 div 가 100vh + 배경을 담당한다.
 */
export function PostGallery({ images, title }: { images: SiteImage[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const isOpen = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setIndex((cur) => (cur === null ? null : (cur + delta + images.length) % images.length)),
    [images.length],
  );

  // 열려 있는 동안 배경 스크롤 잠금 + 키보드 조작
  useEffect(() => {
    if (!isOpen) return;
    document.body.dataset.lightboxOpen = "true";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      delete document.body.dataset.lightboxOpen;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, step]);

  const current = index === null ? null : images[index];

  return (
    <>
      <div className="space-y-4">
        {images.map((img, i) => (
          <figure key={img.src} className="overflow-hidden rounded-sm bg-ivory-200">
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${title} 사진 ${i + 1} 크게 보기`}
              className="block w-full cursor-zoom-in"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={img.width || 1080}
                height={img.height || 1080}
                preload={i === 0}
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-auto w-full"
              />
            </button>
            <figcaption className="sr-only">{img.alt}</figcaption>
          </figure>
        ))}
      </div>

      {isOpen && current && (
        // 바깥: 배경 없음 + 짧은 높이 (iOS 26 Safari viewport 버그 회피)
        <div className="fixed left-0 right-0 top-0 z-50 h-12">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} 사진 보기`}
            onClick={close}
            // relative 필수: 아래 컨텐츠가 absolute 로 이 100vh 박스를 기준 삼는다.
            // 없으면 바깥 fixed 래퍼(48px)가 기준이 돼 사진이 납작하게 접힌다.
            className="relative flex h-screen w-screen items-center justify-center bg-ink-900/95"
          >
            {/* 컨텐츠는 safe-area 안쪽으로. 100vh−100dvh 만큼 하단 크롬 높이를 뺀다 */}
            <div
              className="absolute left-0 right-0"
              style={{
                top: "env(safe-area-inset-top, 0px)",
                bottom: "calc(env(safe-area-inset-bottom, 0px) + (100vh - 100dvh))",
              }}
            >
              <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center justify-between px-4 py-3 text-ivory-200">
                  <span className="text-sm tabular-nums">
                    {index + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="닫기"
                    className="rounded-full px-3 py-1 text-2xl leading-none transition-colors hover:text-ivory-50"
                  >
                    ×
                  </button>
                </div>

                {/* 사진 영역: 배경 클릭으로 닫히되 사진 자체 클릭은 통과시키지 않는다 */}
                <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative flex h-full w-full items-center justify-center"
                  >
                    {/* width/height + w-auto 는 브라우저의 밀도 보정 intrinsic 크기(작게 잡힘)를
                        따라가 사진이 화면의 절반도 못 쓴다 → fill 로 컨테이너에 맞춘다. */}
                    <Image
                      src={current.src}
                      alt={current.alt}
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          step(-1);
                        }}
                        aria-label="이전 사진"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-ink-900/60 px-4 py-3 text-xl text-ivory-50 transition-colors hover:bg-ink-900"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          step(1);
                        }}
                        aria-label="다음 사진"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-ink-900/60 px-4 py-3 text-xl text-ivory-50 transition-colors hover:bg-ink-900"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
