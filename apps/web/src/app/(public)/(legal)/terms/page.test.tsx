// 이용약관 라우트 — 화면 언어의 약관 문서를 보여 준다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import TermsPage from './page';

const locale = vi.hoisted(() => ({ current: 'ko' }));
vi.mock('next-intl/server', () => ({ getLocale: async () => locale.current }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  locale.current = 'ko';
});

describe('TermsPage', () => {
  it('한국어 화면이면 한국어 약관을 보여 준다', async () => {
    render(await TermsPage());

    expect(
      screen.getByRole('heading', { name: '서비스 이용약관' }),
    ).toBeInTheDocument();
  });

  it('일본어 화면이면 환급·친구 초대 조항이 없는 일본어 약관을 보여 준다', async () => {
    locale.current = 'ja';
    setTestLocale('ja');

    render(await TermsPage());

    expect(
      screen.getByRole('heading', { name: '利用規約' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/100日|招待/)).not.toBeInTheDocument();
  });
});
