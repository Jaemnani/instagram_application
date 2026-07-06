/**
 * 동기화 CLI 진입점.  사용:  npm run sync
 * IG_LONG_LIVED_TOKEN 이 있으면 라이브, 없으면 fixture로 동작한다.
 */
import "./load-env";
import { syncInstagram } from "@/lib/instagram/sync";

syncInstagram()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("동기화 실패:", err);
    process.exit(1);
  });
