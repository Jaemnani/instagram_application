/**
 * 장기 토큰 갱신 CLI.  50~55일 주기로 실행 (cron/Actions).
 * 갱신된 토큰을 출력하므로, 시크릿 스토어/환경변수에 반영해야 한다.
 * (자동 반영은 배포 환경의 시크릿 API 사용 — 환경별로 구현)
 */
import "./load-env";
import { refreshToken } from "@/lib/instagram/client";

refreshToken()
  .then(({ access_token, expires_in }) => {
    const days = Math.round(expires_in / 86400);
    console.log(`✔ 토큰 갱신 완료 (만료까지 ~${days}일)`);
    console.log(`IG_LONG_LIVED_TOKEN=${access_token}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("토큰 갱신 실패:", err);
    process.exit(1);
  });
