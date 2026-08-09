import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /about 내용을 홈 한 페이지로 합쳤다. 이미 색인·공유된 주소가 깨지지 않게 영구 이전.
  async redirects() {
    return [{ source: "/about", destination: "/", permanent: true }];
  },
  // 서버리스 배포 시 런타임에 fs로 읽는 동기화 데이터를 함수 번들에 포함시킨다
  // (/llms.txt, revalidate된 페이지가 빈 데이터로 렌더되는 것 방지).
  outputFileTracingIncludes: {
    "/*": ["./data/instagram.json"],
  },
  images: {
    // 자체 호스팅 이미지는 /public/media 정적 파일. 운영 이미지는 jpg.
    // 개발/폴백용 SVG 플레이스홀더를 next/image로 서빙하기 위해 허용 (자체 생성 → 신뢰 가능).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
