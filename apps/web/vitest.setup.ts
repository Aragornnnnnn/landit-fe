// 모든 테스트에서 jest-dom 매처(toBeInTheDocument 등)를 쓸 수 있게 확장한다
import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';

import ja from './src/shared/i18n/locales/ja';
import ko from './src/shared/i18n/locales/ko';
import { mergeMessages } from './src/shared/i18n/messages';
import { testIntl } from './src/shared/i18n/test-locale';
import { TIME_ZONE } from './src/shared/i18n/time-zone';

// 테스트에서 앰플리튜드 키가 실수로 주입돼도 실제 SDK 전송이 일어나지 않게 no-op 모드를 강제한다
process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY = '';

// 서버(request.ts)와 같은 규칙으로 싣는다 — 일본어는 한국어 위에 덮어 번역 없는 키가 한국어로 남는다
const messagesOf = () =>
  testIntl.locale === 'ja' ? mergeMessages(ko, ja) : ko;

// 문구는 실제 문구 파일로 채운다 — Provider 없이 렌더해도 화면에 예전과 같은 한국어가 그려져서,
// 문구를 키로 옮겨도 getByText('구독 해지하기') 같은 기존 테스트가 그대로 통과한다.
// 일본어 동작은 setTestLocale('ja')로 그 테스트만 바꿔 본다
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useLocale: () => testIntl.locale,
    useMessages: messagesOf,
    useTimeZone: () => TIME_ZONE,
    useNow: () => new Date(),
    useTranslations: (namespace?: keyof typeof ko) =>
      actual.createTranslator({
        locale: testIntl.locale,
        messages: messagesOf() as typeof ko,
        namespace,
      }),
    useFormatter: () =>
      actual.createFormatter({ locale: testIntl.locale, timeZone: TIME_ZONE }),
  };
});

afterEach(() => {
  testIntl.locale = 'ko';
  if (typeof document !== 'undefined') document.documentElement.lang = '';
});
