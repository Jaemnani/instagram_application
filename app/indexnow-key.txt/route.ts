import { indexNowKey } from "@/lib/seo/indexnow";

/**
 * IndexNow 소유 증명 파일. 검색엔진이 제출을 받으면 이 URL 을 읽어
 * 본문이 제출에 쓰인 키와 같은지 확인한다. 이 파일이 없으면 제출이 무시된다.
 */
export async function GET() {
  const key = indexNowKey();
  if (!key) return new Response("Not found", { status: 404 });

  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
