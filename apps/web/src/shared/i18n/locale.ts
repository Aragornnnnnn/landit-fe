// 화면 언어를 정하는 규칙 — 지원 언어 목록, 저장 언어 쿠키·Accept-Language·html lang 해석

export const LOCALES = ['ko', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

// 지원하지 않는 언어의 기기는 지금처럼 한국어로 보여 준다
export const DEFAULT_LOCALE: Locale = 'ko';

/** 한국에서만 파는 혜택(환급·친구 초대·이탈 할인)을 보여 줄 화면인가 — 일본어 화면은 구독만 판다 */
export const sellsKoreaOnlyOffers = (locale: Locale) => locale === 'ko';

const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

// q는 0~1, 소수 셋째 자리까지만 유효하다(RFC 9110) — Infinity·1.5 같은 값은 0으로 보고 그 언어를 고르지 않는다
const VALID_QUALITY = /^(0(\.\d{0,3})?|1(\.0{0,3})?)$/;
const qualityOf = (value: string) =>
  VALID_QUALITY.test(value) ? Number(value) : 0;

/**
 * Accept-Language 헤더에서 지원 언어를 하나 고른다. 우선순위(q)가 높은 것부터 보고, 지역(`-JP`)은 무시한다.
 * q=0(거절)이나 읽을 수 없는 q는 고르지 않는다 — 백엔드(AppLocale.fromAcceptLanguage)와 같은 규칙이다.
 *
 * @param header 요청의 Accept-Language (예: `ja-JP,ja;q=0.9,en-US;q=0.8`). 없으면 null
 * @returns 지원 언어가 하나도 없으면 DEFAULT_LOCALE
 */
export const localeFromAcceptLanguage = (header: string | null): Locale => {
  const languages = (header ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      // q는 대소문자를 가리지 않고 = 앞뒤 공백도 허용한다 (q=0.9, Q=0.9, q = 0.9)
      const q = params.find((p) => /^q\s*=/i.test(p.trim()));
      return {
        language: tag.trim().split('-')[0].toLowerCase(),
        quality: q ? qualityOf(q.split('=')[1].trim()) : 1,
      };
    })
    .filter((r) => r.quality > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((r) => r.language);

  return languages.find(isLocale) ?? DEFAULT_LOCALE;
};

/** 로그인한 사용자의 저장 언어를 서버 렌더에 알리는 쿠키 — 웹이 `GET /api/v1/me/locale` 결과로 쓴다 */
export const LOCALE_COOKIE = 'landit-locale';

/**
 * 요청의 화면 언어를 정한다. 저장 언어 쿠키가 있으면 그 값이 먼저다 — 한 번 고른 언어는 기기 언어가 바뀌어도 유지한다.
 * 쿠키가 없으면(로그인 전·재설치 직후) 기기 언어(Accept-Language)로 그린다.
 *
 * @param cookie 저장 언어 쿠키 값. 없으면 null
 * @param acceptLanguage 요청의 Accept-Language. 없으면 null
 */
export const resolveRequestLocale = (
  cookie: string | null,
  acceptLanguage: string | null,
): Locale =>
  cookie && isLocale(cookie)
    ? cookie
    : localeFromAcceptLanguage(acceptLanguage);

/**
 * 기기 선호 언어 목록을 우선순위 그대로 Accept-Language로 만든다 — 신규 가입 때 백엔드가 이 목록에서 ko·ja를 고른다.
 * 앞에서부터 q를 0.1씩 낮춘다(`en-US,ja-JP;q=0.9,ko;q=0.8`). 목록이 비면 null이라 호출부가 헤더를 붙이지 않는다
 *
 * @param languages `navigator.languages`
 */
export const acceptLanguageOf = (languages: readonly string[]) => {
  const list = languages.filter(Boolean).slice(0, 10);
  if (list.length === 0) return null;
  return list
    .map((tag, index) =>
      index === 0 ? tag : `${tag};q=${((10 - index) / 10).toFixed(1)}`,
    )
    .join(',');
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
