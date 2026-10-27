// 언어 판단 규칙 검증 — Accept-Language에서 지원 언어 고르기, 문서 lang 읽기
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  acceptLanguageOf,
  localeFromAcceptLanguage,
  localeFromDocument,
  resolveRequestLocale,
  sellsKoreaOnlyOffers,
} from './locale';

describe('resolveRequestLocale', () => {
  it('저장 언어 쿠키가 있으면 기기 언어보다 먼저다 — 고른 언어는 기기 언어가 바뀌어도 유지한다', () => {
    expect(resolveRequestLocale('ja', 'ko-KR,en;q=0.9')).toBe('ja');
    expect(resolveRequestLocale('ko', 'ja-JP')).toBe('ko');
  });

  it('쿠키가 없거나 지원하지 않는 값이면 기기 언어로 정한다', () => {
    expect(resolveRequestLocale(null, 'ja-JP')).toBe('ja');
    expect(resolveRequestLocale('en', 'ja-JP')).toBe('ja');
    expect(resolveRequestLocale(null, null)).toBe('ko');
  });
});

describe('acceptLanguageOf', () => {
  it('기기 선호 언어 목록을 우선순위 그대로 q를 낮춰 잇는다', () => {
    expect(acceptLanguageOf(['en-US', 'ja-JP', 'ko'])).toBe(
      'en-US,ja-JP;q=0.9,ko;q=0.8',
    );
  });

  it('목록이 비면 헤더를 만들지 않는다', () => {
    expect(acceptLanguageOf([])).toBeNull();
  });
});

describe('localeFromAcceptLanguage', () => {
  it.each([['ko;Q=0.1,ja;q=0.9'], ['ko;q = 0.1,ja']])(
    'q 표기가 대문자거나 띄어 써도(%s) 우선순위를 읽는다',
    (header) => {
      expect(localeFromAcceptLanguage(header)).toBe('ja');
    },
  );

  it.each([
    ['ja-JP,ja;q=0.9,en-US;q=0.8', 'ja'],
    ['ko-KR,ko;q=0.9', 'ko'],
    ['JA', 'ja'],
  ])('%s면 %s를 고른다', (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected);
  });

  it('지원 언어가 여럿이면 우선순위(q)가 높은 쪽을 고른다', () => {
    expect(localeFromAcceptLanguage('ko;q=0.5,ja;q=0.8')).toBe('ja');
  });

  it('우선순위가 0인 언어는 거절한 것으로 보고 고르지 않는다', () => {
    expect(localeFromAcceptLanguage('ja;q=0,en-US')).toBe('ko');
  });

  it.each([
    ['ja;q=Infinity,ko;q=0.9'],
    ['ja;q=1.5,ko;q=0.9'],
    ['ja;q=abc,ko;q=0.9'],
  ])('q가 0~1 숫자가 아니면(%s) 그 언어는 고르지 않는다', (header) => {
    expect(localeFromAcceptLanguage(header)).toBe('ko');
  });

  it('지원하지 않는 언어가 앞서면 건너뛰고 다음 지원 언어를 고른다', () => {
    expect(localeFromAcceptLanguage('en-US,ja;q=0.7')).toBe('ja');
  });

  it.each([['en-US,en;q=0.9'], ['']])(
    '지원 언어가 없으면(%s) 한국어로 둔다',
    (header) => {
      expect(localeFromAcceptLanguage(header)).toBe('ko');
    },
  );

  it('헤더가 없으면 한국어로 둔다', () => {
    expect(localeFromAcceptLanguage(null)).toBe('ko');
  });
});

describe('localeFromDocument', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.lang = '';
  });

  it('html lang이 지원 언어면 그 언어를 준다', () => {
    document.documentElement.lang = 'ja';

    expect(localeFromDocument()).toBe('ja');
  });

  it('서버처럼 문서가 없으면 한국어를 준다', () => {
    vi.stubGlobal('document', undefined);

    expect(localeFromDocument()).toBe('ko');
  });

  it('html lang이 지원 언어가 아니면 한국어를 준다', () => {
    document.documentElement.lang = 'fr';

    expect(localeFromDocument()).toBe('ko');
  });
});

describe('sellsKoreaOnlyOffers', () => {
  it('한국어 화면만 한국 전용 혜택을 보여 준다', () => {
    expect(sellsKoreaOnlyOffers('ko')).toBe(true);
    expect(sellsKoreaOnlyOffers('ja')).toBe(false);
  });
});
