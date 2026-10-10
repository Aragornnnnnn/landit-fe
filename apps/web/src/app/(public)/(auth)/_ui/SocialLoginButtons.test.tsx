// 로그인 버튼 묶음 — 마지막으로 로그인한 방법의 버튼에만 「최근 로그인」이 붙는지 검증한다
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SocialLoginButtons } from './SocialLoginButtons';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: () => false,
  subscribeFromNative: () => () => {},
}));

const STORAGE_KEY = 'landit-last-login-provider';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

// 「최근 로그인」이 붙은 버튼의 라벨들
const recentLabels = () =>
  screen
    .getAllByText('최근 로그인')
    .map(
      (badge) =>
        within(badge.closest('[data-recent]') as HTMLElement).getByRole(
          'button',
        ).textContent,
    );

describe('SocialLoginButtons — 최근 로그인 표시', () => {
  it('마지막으로 로그인한 방법의 버튼에만 표시가 붙는다', () => {
    // given
    localStorage.setItem(STORAGE_KEY, 'google');

    // when
    render(<SocialLoginButtons />);

    // then
    expect(recentLabels()).toEqual(['구글로 로그인하기']);
  });

  it('로그인한 적이 없는 기기에서는 표시가 없다', () => {
    render(<SocialLoginButtons />);

    expect(screen.queryByText('최근 로그인')).toBeNull();
  });

  it('애플 버튼이 없는 안드로이드에서는 마지막 방법이 애플이어도 표시가 없다', () => {
    // given
    localStorage.setItem(STORAGE_KEY, 'apple');
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 14)',
    });

    // when
    render(<SocialLoginButtons />);

    // then
    expect(screen.queryByText('최근 로그인')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /애플로 로그인하기/ }),
    ).toBeNull();
  });
});
