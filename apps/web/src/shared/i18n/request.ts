// next-intl 요청 설정 — 요청마다 화면 언어를 정하고 그 언어의 문구를 싣는다
import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

import { DEFAULT_LOCALE, localeFromAcceptLanguage } from './locale';
import ko from './locales/ko';
import { mergeMessages } from './messages';

// URL에 언어를 붙이지 않는다 — 기기 언어가 실려 오는 Accept-Language만 보고 정한다
export default getRequestConfig(async () => {
  const locale = localeFromAcceptLanguage(
    (await headers()).get('accept-language'),
  );
  const messages =
    locale === DEFAULT_LOCALE
      ? ko
      : mergeMessages(ko, (await import(`./locales/${locale}`)).default);

  return { locale, messages };
});
