// 훅을 못 쓰는 모듈(API 응답 해석·전체 오류 화면 등)이 common 문구를 화면 언어로 꺼내는 번역 함수 — 언어는 기본으로 html lang에서 읽는다
import { createTranslator } from 'next-intl';

import { localeFromDocument, type Locale } from './locale';
import jaCommon from './locales/ja/common.json';
import koCommon from './locales/ko/common.json';
import { mergeMessages } from './messages';

/** 언어를 안 주면 부를 때마다 html lang을 다시 읽는다 — 서버에서 불리면 한국어 */
export const commonTranslator = (locale: Locale = localeFromDocument()) => {
  const common = locale === 'ja' ? mergeMessages(koCommon, jaCommon) : koCommon;
  return createTranslator({
    locale,
    messages: { common: common as typeof koCommon },
    namespace: 'common',
  });
};
