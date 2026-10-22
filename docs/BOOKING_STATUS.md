# 통합 예약 — 현재 상태와 남은 단계

> 2026-10-22 기준. 새 작업 세션은 이 문서부터 읽고 시작한다.
> 손대기 전 규칙은 루트 `CLAUDE.md`, 과정·실측 기록은 `.claude/MEMORY.md`.

## 한 줄 요약

손님은 **네이버에서 예약**하고, 홈페이지는 **모든 채널을 합친 빈 시간**을 보여준다.
모든 예약은 스튜디오 공유 캘린더 **SIDO**(애플)에 모이고, 거기 적힌 시간은 **다른 예약 사이트에서
자동으로 마감**되게 만드는 중이다. 아워플레이스는 완료, 스페이스클라우드·네이버는 로봇이 남았다.

---

## 1. 확정된 결정

| 항목 | 결정 |
|---|---|
| 손님 예약 창구 | **네이버 예약** (한국인·외국인 모두). 외국어 페이지에는 네이버 예약 방법 안내 |
| 예약 규칙 | 시작 30분 단위 · 상품 1시간/2시간 · 예약 사이 30분 텀(외부 일정에도 적용) · 24시간 전까지 · 60일 앞까지 |
| 중심 캘린더 | 애플 공유 캘린더 **SIDO** (스튜디오 4명 공유, 공개 링크 꺼짐) |
| 일정 제목 규칙 | `HJ <채널> <종류>` — 예: `HJ 스클 대관`, `HJ 아워플레이스 대관`, `HJ 네이버 kidding`, `HJ 홈페이지 kidding [대기] …` |
| 홈페이지 신청서 | 만들어 뒀지만 **꺼둠** (`BOOKING_REQUESTS_ENABLED=true` 로만 켜짐). 켜면 개인정보처리방침 개정 필수 |
| 네이버 "예약" 구독 캘린더 | **사용 금지** — 계정 주인이 손님으로 다른 가게에 예약한 내역이었다 |

## 2. 구조

```
 들어오는 예약                       SIDO (애플 공유 캘린더)                    나가는 마감
 ─────────────                     ─────────────────────                   ─────────────
 아워플레이스 ──(직접 읽음)──┐                                          ┌──▶ 아워플레이스   ✅ 피드(자동)
 스페이스클라우드 ─(직접 읽음)─┤      홈페이지 빈 시간 계산                  ├──▶ 스페이스클라우드 ⏳ 로봇(미착수)
 네이버 ──(직원이 SIDO에 기록)─┤ ──▶ (모든 출처 합산 + 30분 텀) ──────────┤
 기타 수동 일정 ──(SIDO)─────┘                                          └──▶ 네이버          ⏳ 로봇(미착수)
```

**안전장치:** 자동 마감이 늦거나 실패해도, "다른 사이트 마감 확인 → 확정" 순서를 지키면 겹치기 예약은 생기지 않는다.

## 3. 완료된 것 (PR 로 검토 중)

| 기능 | 주요 파일 | 확인 |
|---|---|---|
| 빈 시간 계산 + `/[lang]/book` | `lib/booking/{availability,slots,sources,time,config}.ts`, `components/BookingPicker.tsx` | 단위 테스트 |
| 외부 캘린더 읽기 — 아워플레이스·스페이스클라우드 | `lib/booking/sources.ts` | 실계정: 추가·삭제 즉시 반영 |
| 아워플레이스 "한가함" 표시 무시 (안 하면 하나도 안 막힘) | `sources.ts busyFromIcs` | 옛 코드로 되돌리면 테스트 4건 실패 확인 |
| 애플 SIDO 읽기·쓰기 (CalDAV, `tsdav`) | `lib/booking/icloud.ts`, `ics.ts`, `request.ts` | 실계정 종단 시험: 저장 1.4초, 아이폰 즉시 표시, 주인 폰 알림, 삭제 시 즉시 다시 열림 |
| 홈페이지 신청 API (꺼둠) | `app/api/booking/request/route.ts`, `components/BookingRequestForm.tsx` | 검증·봇 함정·횟수 제한 |
| 예약 버튼 → 네이버, 문의 링크 분리, 순환 링크 차단 | `lib/links.ts` | `NAVER_BOOKING_URL` 가 있으면 동작 |
| **막힌 시간 피드** (아워플레이스용) | `app/api/booking/feed/[file]/route.ts`, `lib/booking/feed.ts` | 실캘린더로 생성 확인, 개인정보 0 |
| 개인정보처리방침 GA4 문구·시행일 | `lib/i18n/dictionaries/*.ts` privacy | 4개 언어 |
| 갤러리 페이지·숨김 목록·홈 스트립 12개 | `app/[lang]/gallery`, `data/curation.json`, `lib/curation.ts` | 휠 완주 |
| 매주 월 03:00 KST 자동 재배포 | `app/api/sync/route.ts`, `vercel.json` | |

테스트: `npm test` (18건). 시간대 확인은 `TZ=UTC npm test`, `TZ=America/Los_Angeles npm test` 까지 세 번.

## 4. 환경 변수

| 이름 | 용도 | 로컬 | Vercel |
|---|---|---|---|
| `IG_LONG_LIVED_TOKEN` | 인스타 동기화 | ❌ **무효** | ❌ **무효** (아래 위험 1) |
| `BOOKING_ICS_SOURCES` | 아워플레이스·스페이스클라우드 내보내기 주소 | ✅ | ✅ |
| `APPLE_CALDAV_USER` / `_PASSWORD` / `APPLE_BOOKING_CALENDAR` | SIDO 읽기·쓰기 (앱 암호) | ✅ | ✅ |
| `BOOKING_FEED_TOKEN` | 막힌 시간 피드 주소의 비밀 토큰 | ✅ | ❌ **추가 필요** (로컬 값 그대로) |
| `NAVER_BOOKING_URL` | 네이버 예약 페이지 | ❌ | ❌ **네이버 예약 등록 후** |
| `BOOKING_URL` | 카카오톡 문의 | ❌ | ✅ |
| `BOOKING_REQUESTS_ENABLED` | 홈페이지 신청서 켜기 | — | — (켜지 않음) |
| `CRON_SECRET` / `DEPLOY_HOOK_URL` | 매주 자동 재배포 | — | ✅ |
| `NAVER_CALDAV_*` | (쓰지 않음 — 지워도 됨) | 있음 | — |

## 5. 사장님 할 일

- [ ] **Instagram 토큰 재발급** → `.env.local` + Vercel → Redeploy (지금 배포가 전부 실패한다)
- [ ] Vercel 에 `BOOKING_FEED_TOKEN` 추가 (`.env.local` 의 값 복사)
- [ ] 네이버 예약 등록 완료 → 예약 페이지 주소를 `NAVER_BOOKING_URL` 로 (로컬 + Vercel)
- [ ] 배포 후 아워플레이스 → 캘린더 설정 → 외부 캘린더 가져오기에 `https://kidding.kr/api/booking/feed/<토큰>.ics` 등록
- [ ] GA4 관리 → 데이터 수집에서 **"Google 신호" 꺼짐** 확인 (방침에 "방문 추세 파악에만 사용"이라 적음)
- [ ] 네이버 앱 비밀번호 삭제 (네이버 → 보안설정 → 애플리케이션 비밀번호) — 쓰지 않음, 채팅에 노출됨
- [ ] 스페이스클라우드 연결 공간 "시도스튜디오(시도 스튜디오)"가 키딩성수와 같은 공간인지 확인

## 6. 남은 단계 (순서대로)

1. **로봇 준비 (정보 수집)**
   - 로봇 실행 위치: 시놀로지 NAS(Container Manager/Docker) 또는 항상 켜진 맥·PC
   - 스페이스클라우드 호스트센터 로그인 방식 (이메일 / 간편로그인)
   - "시간 막는 화면" 정찰 — 사장님 크롬에서 연 화면을 읽기만 한다(마감 버튼은 누르지 않음)
2. **스페이스클라우드 로봇** — SIDO 의 확정 일정(제목에 `[대기]` 없음, 스클 자기 일정 제외)을 호스트센터에서 마감, 일정이 지워지면 해제. 실패 시 알림. 테스트 날짜 하나로 막기→풀기 시험
3. **네이버 로봇** — 같은 방식. ⚠️ 네이버 약관은 자동화에 엄격(계정 제한 위험), 2단계 인증 때문에 로봇 전용 브라우저에 사장님이 한 번 로그인하고 세션을 이어 쓴다. 로그인이 풀리면 알림
4. **네이버 예약 → SIDO 자동 기록** (지금은 직원이 손으로 적음) — 로봇이 네이버 예약 목록을 읽어 SIDO 에 `HJ 네이버 kidding` 으로 기록
5. **외국인 채널 검토** — 구글 예약(지도·검색 "예약" 버튼), 에어비앤비(체험/서비스). 기준: 읽기 자동? 쓰기 자동? 외국인 결제·언어? 수수료?
6. 관리자 통합 화면 (필요해지면)

## 7. 알려진 문제·위험

1. **Instagram 토큰이 11일 만에 두 번째 무효화** ("세션 무효화", 190). 원인 미확인 — 인스타 비밀번호 변경·전체 로그아웃·보안 점검 의심. 무효인 동안 빌드 전 동기화가 실패해 **모든 배포 실패**(사이트는 이전 버전 유지). 로컬 검증은 `npx next build`(동기화 생략).
2. **갤러리 가로 줄 휠 버그 (기존)** — 마우스 한 칸(100px)·트랙패드로 굴리면 옆으로 한 칸도 안 넘어간다. `components/StripControls.tsx` 의 `el.scrollLeft += deltaY` 가 `snap-x snap-mandatory` 에 의해 매번 되돌려짐. `scrollBy` 는 한 장(274px)씩 넘어감(실측) — 작은 움직임을 모아 한 장씩 넘기는 방식으로 고칠 것.
3. **신청서를 켜면** 개인정보처리방침 1항이 사실과 달라진다 (이름·연락처 수집 목적·보관기간·Apple iCloud 국외 이전·보호책임자 추가 필요).
4. 로봇은 각 사이트 화면이 바뀌면 멈춘다 — 실패 알림 필수.

## 8. 새 세션 시작 체크리스트

```bash
git log --oneline -5 && git status -sb          # 어디까지 왔나
npm test                                         # 18건 통과해야 함
node --env-file=.env.local -e 'fetch("https://graph.instagram.com/me?fields=username&access_token="+process.env.IG_LONG_LIVED_TOKEN).then(r=>r.json()).then(console.log)'   # 토큰 살아 있나
```

함정 모음: `~/.claude/TOOL_GOTCHAS.md` — "브라우저 스크롤 함정", "Turbopack CSS", "node-ical floating 시각 + TRANSP".
측정 함정: Playwright 합성 휠은 mandatory 스냅을 다음 장면으로 못 넘긴다 → 휠 한 칸을 화면 높이의 60% 로.
