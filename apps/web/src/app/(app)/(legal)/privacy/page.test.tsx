// 개인정보 처리방침 라우트 — 화면 언어의 처리방침 문서를 보여 준다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import PrivacyPage from './page';

const locale = vi.hoisted(() => ({ current: 'ko' }));
vi.mock('next-intl/server', () => ({ getLocale: async () => locale.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  locale.current = 'ko';
});

describe('PrivacyPage', () => {
  it('한국어 화면이면 한국어 처리방침을 보여 준다', async () => {
    render(await PrivacyPage());

    expect(
      screen.getByRole('heading', { name: '개인정보 처리방침' }),
    ).toBeInTheDocument();
  });

  it('일본어 화면이면 일본어 처리방침을 보여 준다', async () => {
    locale.current = 'ja';
    setTestLocale('ja');

    render(await PrivacyPage());

    expect(
      screen.getByRole('heading', { name: 'プライバシーポリシー' }),
    ).toBeInTheDocument();
  });
});
