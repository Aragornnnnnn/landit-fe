// 훅을 못 쓰는 모듈(API 응답 해석 등)이 common 문구를 화면 언어로 꺼내는 번역 함수 — 언어는 html lang에서 읽는다
import { createTranslator } from 'next-intl';

import { localeFromDocument } from './locale';
import jaCommon from './locales/ja/common.json';
import koCommon from './locales/ko/common.json';
import { mergeMessages } from './messages';

/** 부를 때마다 html lang을 다시 읽는다 — 서버에서 불리면 한국어 */
export const commonTranslator = () => {
  const locale = localeFromDocument();
  const common = locale === 'ja' ? mergeMessages(koCommon, jaCommon) : koCommon;
  return createTranslator({
    locale,
    messages: { common: common as typeof koCommon },
    namespace: 'common',
  });
};
