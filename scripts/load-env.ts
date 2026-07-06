/** 사이드이펙트 모듈: 다른 import보다 먼저 .env(.local)를 로드한다.
 *  스크립트의 첫 import로 둘 것. */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
