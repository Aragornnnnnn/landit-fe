// 테스트 화면 언어 — 기본은 한국어, 일본어에서만 달라지는 동작을 확인할 테스트에서 바꾼다. vitest.setup이 읽고 테스트마다 되돌린다
import type { Locale } from './locale';

export const testIntl: { locale: Locale } = { locale: 'ko' };

/**
 * 이 테스트를 그 언어 화면으로 렌더한다 — 문구·useLocale·html lang(API 헤더·지표가 읽는 값)이 함께 바뀐다.
 * 렌더하기 전에 부른다. 테스트가 끝나면 vitest.setup이 한국어로 되돌린다
 */
export const setTestLocale = (locale: Locale) => {
  testIntl.locale = locale;
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
};
