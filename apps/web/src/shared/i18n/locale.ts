// 화면 언어를 정하는 규칙 — 지원 언어 목록과 Accept-Language·html lang 해석
import { JAPANESE_ENABLED } from './japanese-flag';

export const LOCALES = ['ko', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

// 지원하지 않는 언어의 기기는 지금처럼 한국어로 보여 준다
export const DEFAULT_LOCALE: Locale = 'ko';

const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/**
 * Accept-Language 헤더에서 지원 언어를 하나 고른다. 우선순위(q)가 높은 것부터 보고, 지역(`-JP`)은 무시한다.
 * q=0(거절)이나 읽을 수 없는 q는 고르지 않는다 — 백엔드(AppLocale.fromAcceptLanguage)와 같은 규칙이다.
 *
 * @param header 요청의 Accept-Language (예: `ja-JP,ja;q=0.9,en-US;q=0.8`). 없으면 null
 * @returns 지원 언어가 하나도 없거나 일본어 출시 스위치가 꺼져 있으면 DEFAULT_LOCALE
 */
export const localeFromAcceptLanguage = (header: string | null): Locale => {
  // 지원 언어가 한국어·일본어 둘뿐이라, 일본어를 잠그면 고를 언어가 한국어밖에 없다
  if (!JAPANESE_ENABLED) return DEFAULT_LOCALE;

  const languages = (header ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      // q는 대소문자를 가리지 않고 = 앞뒤 공백도 허용한다 (q=0.9, Q=0.9, q = 0.9)
      const q = params.find((p) => /^q\s*=/i.test(p.trim()));
      return {
        language: tag.trim().split('-')[0].toLowerCase(),
        quality: q ? Number(q.split('=')[1]) : 1,
      };
    })
    .filter((r) => r.quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((r) => r.language);

  return languages.find(isLocale) ?? DEFAULT_LOCALE;
};

/**
 * 서버가 정해 html lang에 박은 언어를 읽는다. 브라우저에서 보내는 요청이 화면과 같은 언어를 쓰게 하는 단일 출처.
 * 서버에서 불리면(문서가 없으면) 기본 언어를 준다.
 */
export const localeFromDocument = (): Locale => {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
};
