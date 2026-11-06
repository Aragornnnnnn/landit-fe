// next-intl 요청 설정 — 요청마다 화면 언어를 정하고 그 언어의 문구를 싣는다
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  PATH_LOCALE_HEADER,
  resolveRequestLocale,
} from './locale';
import ko from './locales/ko';
import { mergeMessages } from './messages';
import { TIME_ZONE } from './time-zone';

// 일본어 문구는 배포 단위로 고정이라 한 번만 합친다 — 요청마다 문구 전체를 다시 합치지 않게
let jaMessages: ReturnType<typeof mergeMessages> | undefined;
const loadJaMessages = async () =>
  (jaMessages ??= mergeMessages(ko, (await import('./locales/ja')).default));

// 앱 화면은 URL에 언어를 붙이지 않는다 — 저장 언어 쿠키가 먼저, 없으면 기기 언어(Accept-Language).
// 랜딩(/ko·/ja)만 주소가 언어를 정하고, proxy가 그 언어를 헤더로 넘긴다
export default getRequestConfig(async () => {
  const requestHeaders = await headers();
  const pathLocale = requestHeaders.get(PATH_LOCALE_HEADER) ?? '';
  const locale = isLocale(pathLocale)
    ? pathLocale
    : resolveRequestLocale(
        (await cookies()).get(LOCALE_COOKIE)?.value ?? null,
        requestHeaders.get('accept-language'),
      );
  const messages = locale === DEFAULT_LOCALE ? ko : await loadJaMessages();

  // 시간대를 고정해야 서버와 브라우저가 같은 날짜를 그린다 — 비우면 next-intl이 경고하고 둘이 어긋날 수 있다
  return { locale, messages, timeZone: TIME_ZONE };
});
