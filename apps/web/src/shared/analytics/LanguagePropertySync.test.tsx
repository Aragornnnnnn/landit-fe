// LanguagePropertySync — 화면 언어를 유저 속성 app_language로 올린다. 실행 중에 언어가 바뀌어도 그 값을 따라간다
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { LanguagePropertySync } from './LanguagePropertySync';

const setUserProperties = vi.hoisted(() => vi.fn());
vi.mock('./amplitude', () => ({ setUserProperties }));

afterEach(() => {
  cleanup();
  setUserProperties.mockClear();
});

describe('LanguagePropertySync', () => {
  it.each([
    ['한국어', 'ko'],
    ['일본어', 'ja'],
  ] as const)('%s 화면이면 그 언어를 유저 속성으로 올린다', (_, locale) => {
    setTestLocale(locale);

    render(<LanguagePropertySync />);

    expect(setUserProperties).toHaveBeenCalledWith({ app_language: locale });
  });
});
