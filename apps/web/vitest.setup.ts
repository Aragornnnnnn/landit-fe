// 모든 테스트에서 jest-dom 매처(toBeInTheDocument 등)를 쓸 수 있게 확장한다
import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

import ko from './src/shared/i18n/locales/ko';
import { TIME_ZONE } from './src/shared/i18n/time-zone';

// 테스트에서 앰플리튜드 키가 실수로 주입돼도 실제 SDK 전송이 일어나지 않게 no-op 모드를 강제한다
process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY = '';

// 문구는 실제 한국어 파일로 채운다 — Provider 없이 렌더해도 화면에 예전과 같은 한국어가 그려져서,
// 문구를 키로 옮겨도 getByText('구독 해지하기') 같은 기존 테스트가 그대로 통과한다
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useLocale: () => 'ko',
    useTranslations: (namespace?: keyof typeof ko) =>
      actual.createTranslator({ locale: 'ko', messages: ko, namespace }),
    useFormatter: () =>
      actual.createFormatter({ locale: 'ko', timeZone: TIME_ZONE }),
  };
});
