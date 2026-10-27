// next-intl 요청 설정 — 요청마다 화면 언어를 정하고 그 언어의 문구를 싣는다
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveRequestLocale } from './locale';
import ko from './locales/ko';
import { mergeMessages } from './messages';

// 일본어 문구는 배포 단위로 고정이라 한 번만 합친다 — 요청마다 문구 전체를 다시 합치지 않게
let jaMessages: ReturnType<typeof mergeMessages> | undefined;
const loadJaMessages = async () =>
  (jaMessages ??= mergeMessages(ko, (await import('./locales/ja')).default));

// URL에 언어를 붙이지 않는다 — 저장 언어 쿠키가 먼저, 없으면 기기 언어(Accept-Language)
export default getRequestConfig(async () => {
  const locale = resolveRequestLocale(
    (await cookies()).get(LOCALE_COOKIE)?.value ?? null,
    (await headers()).get('accept-language'),
  );
  const messages = locale === DEFAULT_LOCALE ? ko : await loadJaMessages();

  return { locale, messages };
});
