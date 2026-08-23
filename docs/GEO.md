# GEO — 생성형 엔진 최적화 현황과 운영

AI 답변(ChatGPT·Perplexity·Claude·Gemini·AI Overviews)에 이 스튜디오가 **인용되게** 만드는 작업.
검색 결과에서 클릭을 받는 SEO 와 달리, GEO 는 "AI 가 답을 만들 때 우리를 근거로 쓰는가"를 본다.

## 현황 점검 — 언제든 한 줄로

```bash
npm run geo-check -- https://실제도메인      # 배포본 (이게 진짜 확인)
npm run geo-check -- http://localhost:3005 # 로컬 dev (포트는 npm run dev 출력 확인)
npm run geo-check                          # 인자 없으면 SITE_URL 값 — 로컬에선 localhost:3000
```

⚠️ **인자를 주지 않으면 `SITE_URL` 환경변수를 씁니다.** 로컬 `.env.local` 은 개발용이라
`http://localhost:3000` 이라서, dev 서버를 다른 포트로 띄웠거나 배포본을 보려던 경우
전부 `연결 실패 — ECONNREFUSED` 로 나옵니다. 사이트 결함이 아니라 주소 문제입니다.

배포된 사이트에 실제로 요청을 보내 확인한다. 코드가 아니라 **응답**을 보는 이유는, 빌드가
통과해도 배포 결과가 다를 수 있고(캐시·환경변수) AI 는 그 배포 결과로 판단하기 때문이다.

확인 항목 — AI 검색 봇 허용 / llms.txt / sitemap / 언어별 JSON-LD·description·canonical·hreflang /
FAQ 가 직답으로 시작하는지 / GA4 설치. `실패`가 하나라도 있으면 종료 코드 1 이라 CI 에도 걸 수 있다.

### ⚠️ 환경변수가 환경마다 다르면 결과도 다르다

`.env.local` 은 로컬 전용이라 Vercel 에 같은 변수를 넣지 않으면 **배포본은 기본값으로 동작한다.**
실제로 `BUSINESS_TYPE` 이 로컬에만 있어 구조화 데이터 `@type` 이 로컬 `ProfessionalService` /
프로덕션 `LocalBusiness` 로 갈렸다(둘 다 유효해서 조용히 지나갔다).
**점검은 반드시 배포 주소로 한 번 돌려 본다** — 로컬 통과는 배포본을 보증하지 않는다.

## 되어 있는 것

| 항목 | 내용 |
|---|---|
| AI 크롤러 | 학습·검색 봇 17종 명시 허용 (`app/robots.ts`) |
| 구조화 데이터 | Organization, WebSite, ProfessionalService(주소·영업시간·좌표·예약), OfferCatalog, FAQPage, ImageGallery, SocialMediaPosting |
| llms.txt | 서비스·주소·영업시간·예약 경로 요약 (Perplexity 가 참고) |
| 다국어 | ko/en/ja/zh + hreflang + x-default |
| 색인 | sitemap, IndexNow |
| FAQ | 7문항, 모두 짧은 직답으로 시작 |

### AI 크롤러가 학습용과 검색용으로 나뉘어 있다

2026 년 기준 주요 업체는 크롤러를 분리했다. **검색용이 막히면 그 엔진 답변에 인용될 수 없다**
(한 봇 차단당 인용 기회의 18~34% 손실 추정).

| 업체 | 학습용 | 검색용 |
|---|---|---|
| OpenAI | GPTBot | OAI-SearchBot, ChatGPT-User |
| Anthropic | ClaudeBot | Claude-SearchBot, Claude-User |
| Google | Google-Extended | Googlebot |
| Perplexity | — | PerplexityBot, Perplexity-User |
| Apple | Applebot-Extended | Applebot |

학습만 빼고 싶어지면 학습용만 `disallow` 하고 검색용은 열어 둔다 — 그래야 인용 자격은 유지된다.

## 측정 — GA4

`NEXT_PUBLIC_GA_ID` 를 넣으면 켜지고, 없으면 스크립트를 아예 넣지 않는다(로컬·프리뷰 자동 off).

### 설치 후 GA4 콘솔에서 한 번만 해 둘 것

1. **관리 → 맞춤 정의 → 맞춤 측정기준 만들기**
   - 측정기준 이름 `ai_source`, 범위 `이벤트`, 이벤트 매개변수 `ai_source`
2. 하루 정도 지나면 **보고서 → 참여도 → 이벤트**에서 `ai_referral` 이 보인다

### 왜 별도 이벤트인가

AI 유입은 GA4 기본 리포트에서 잘 안 보인다. referrer 를 아예 보내지 않는 엔진이 있어
"직접 유입"으로 뭉뚱그려진다. 그래서 referrer 가 잡히는 경우만이라도 `ai_referral` 이벤트로
남겨 **어느 엔진이 우리를 인용했는지** 세어 본다(`components/Analytics.tsx`).

감지 대상: ChatGPT, Perplexity, Claude, Gemini, Copilot, You.com, Phind, Poe, Meta AI, Grok,
Felo, Genspark, 뤼튼, CLOVA X, 네이버 큐.

### GA4 밖에서 함께 볼 것

- **Google Search Console** — AI Overviews 노출은 일반 검색 실적에 섞여 들어온다. 쿼리별 노출이
  늘었는데 클릭률이 떨어지면 AI 답변에 인용되고 클릭은 안 일어나는 신호일 수 있다.
- **Bing Webmaster Tools** — Copilot 계열의 색인 상태를 여기서 본다.
- **직접 질문해 보기** — 가장 확실한 검증이다. 월 1회 정도 각 엔진에 물어보고 우리가 인용되는지,
  정보가 정확한지 확인한다.
  ```
  성수동 아기 사진 스튜디오 추천해줘
  키딩성수 어떤 곳이야?
  서울숲 근처 돌사진 찍을 만한 곳
  성수동 반려동물 동반 가능한 사진관
  ```
  틀린 정보가 나오면 그 항목을 FAQ·llms.txt·구조화 데이터에 더 또렷하게 넣는다.
- **서버 로그** — Vercel 대시보드에서 user-agent 로 필터하면 실제로 어떤 AI 봇이 언제 크롤했는지
  볼 수 있다. robots 를 열어 뒀는데 방문이 없으면 사이트 권위가 아직 낮다는 뜻이다.

## 남은 일 (코드 밖)

우선순위 순.

1. **엔티티 이름·정보 일관성** — 사이트 / 인스타그램 / **구글 비즈니스 프로필** / 네이버 플레이스에서
   상호·주소·영업시간·전화번호가 **한 글자도 다르지 않아야** AI 가 같은 업체로 묶는다.
   지금 사이트 표기는 `kidding seongsu (키딩성수)`, 주소 `서울 성동구 뚝섬로4길 21-1 3층`.
2. **질문에 답하는 페이지** — 가장 큰 갭이다. 지금은 인스타그램 미러링이라 "돌사진 준비물",
   "백일 촬영 시기", "성수동 스튜디오 고르는 법" 같은 **질문에 답하는 문서가 없다.**
   AI 는 그런 문서를 인용한다. 한 편에 800~1500자, 질문형 제목, 첫 2~3문장에 결론.
3. **제3자 언급** — 블로그 후기, 지역 매체, 커뮤니티. AI 는 자기 사이트 주장보다 외부 언급을
   더 신뢰한다. 촬영 후기 요청이 가장 자연스러운 경로.
4. **신선도** — AI 엔진은 7~14 일 주기로 갱신되는 사이트를 선호한다. 인스타그램 동기화가
   그 역할을 하고 있으니 주기를 유지한다.

## 참고

- [AI Crawlers Explained (Anagram, 2026)](https://www.anagram.ai/blog/ai-crawlers-explained-gptbot-claudebot-perplexitybot-and-how-to-let-them-in-2026)
- [AI Crawler Access Control 2026 (Digital Applied)](https://www.digitalapplied.com/blog/ai-crawler-access-control-2026-robots-llms-txt-decision-matrix)
- [GEO Best Practices 2026 (GenOptima)](https://www.gen-optima.com/blog/generative-engine-optimization-best-practices-complete-2026-playbook/)
