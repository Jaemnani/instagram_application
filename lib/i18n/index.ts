import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { ja } from "./dictionaries/ja";
import { ko, type Dictionary } from "./dictionaries/ko";
import { zh } from "./dictionaries/zh";

const dictionaries: Record<Locale, Dictionary> = { ko, en, ja, zh };

/** 서버 컴포넌트에서 바로 쓴다. 사전은 정적이라 비동기가 필요 없다. */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
export * from "./config";
