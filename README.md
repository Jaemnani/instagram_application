# Instagram → SEO/GEO 홈페이지

소유 중인 **비즈니스/크리에이터 인스타그램 계정**의 콘텐츠를 공식 Instagram Graph API로
가져와, SEO·생성형 엔진(GEO)·지역(Geographic) SEO에 최적화된 홈페이지로 제공한다.
Next.js(App Router) + 주기적 동기화 + 이미지 자체 호스팅 + JSON-LD 구조화 데이터.

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # 값 채우기 (토큰 없으면 데모 fixture로 동작)
npm run sync                 # 인스타 데이터 → data/instagram.json + public/media
npm run dev                  # http://localhost:3000
```

> `IG_LONG_LIVED_TOKEN` 이 없으면 `lib/instagram/fixture.ts` 의 데모 데이터로 동작한다.
> 이미지 다운로드가 불가한 환경에서는 SVG 플레이스홀더로 자동 폴백한다.

## 동작 구조

```
Instagram Graph API ──(npm run sync / cron)──▶ data/instagram.json + public/media/*
                                                     │
                              Next.js SSG/ISR로 정적 페이지 생성
                                                     │
                  SEO 메타 + JSON-LD(GEO/Local) + sitemap/robots/llms.txt
```

| 영역 | 파일 |
|------|------|
| API 클라이언트 / 토큰 갱신 | `lib/instagram/client.ts` |
| 동기화(다운로드·정규화·기록) | `lib/instagram/sync.ts`, `scripts/sync.ts` |
| 캡션 파싱·슬러그·alt | `lib/instagram/normalize.ts` |
| 데이터 접근(페이지용) | `lib/data.ts` |
| 설정(NAP·좌표 등) | `lib/config.ts` |
| 메타데이터 / JSON-LD | `lib/seo/metadata.ts`, `lib/seo/jsonld.ts` |
| 페이지 | `app/page.tsx`, `app/posts/[slug]/page.tsx`, `app/about/page.tsx` |
| SEO/GEO 라우트 | `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts` |
| Cron 동기화 | `app/api/sync/route.ts`, `vercel.json` |

## 라이브(공식 API) 전환

> 본인 소유 계정 1개만 노출하므로 **앱 리뷰(4~6주) 불필요** — 앱을 개발 모드로 두고 본인 계정을 테스터로 추가하면 됨.

1. 인스타 계정을 **비즈니스/크리에이터**로 전환(앱: 설정 → 프로페셔널 계정 전환, 무료).
2. **Meta 개발자 콘솔**(developers.facebook.com): Business 타입 앱 생성 → **Instagram** 제품 추가 → "Instagram API setup with Instagram login".
3. 본인 IG 계정을 **Instagram Tester**(App roles → Roles)로 추가하고 초대 수락.
4. "Generate access tokens"에서 계정 연결 → **Generate token** 클릭 → **장기 토큰(60일)** 발급.
   - 스코프: `instagram_business_basic`(기본) + 댓글 표시 시 `instagram_business_manage_comments`.
5. `.env.local`에 `IG_LONG_LIVED_TOKEN`, `IG_USER_ID`, `IG_USERNAME` 입력 → `npm run sync`.
6. 비즈니스 **NAP + 위경도 좌표**(`BIZ_*`) 입력 → 지역 SEO(LocalBusiness) 활성화.

## 주기 동기화 & 토큰 갱신

- **콘텐츠 동기화**: `vercel.json` 의 cron(기본 6시간)이 `/api/sync` 호출 → 재검증.
  - 보호: `SYNC_SECRET`(또는 Vercel `CRON_SECRET`).
  - 서버리스(읽기전용 FS)에서는 이미지 영구 저장 불가 → 영구 서버에서 실행하거나
    이미지를 Blob 스토리지로 보내거나 빌드 재배포(deploy hook) 방식 사용.
- **토큰 갱신**: 장기 토큰은 60일 만료. `npm run refresh-token` 을 50~55일 주기로 실행해
  새 토큰을 시크릿에 반영(cron/GitHub Actions).

## 검증

- `npm run build` — 타입체크 + 정적 생성.
- 구조화 데이터: 페이지 HTML의 JSON-LD를 [Google Rich Results Test](https://search.google.com/test/rich-results) / Schema Validator로 확인.
- `/robots.txt`, `/sitemap.xml`, `/llms.txt` 응답 확인.
