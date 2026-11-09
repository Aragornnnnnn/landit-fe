// 햅틱 점검 화면 — ADMIN에게만 열리고, 진동 칸이나 상황 줄을 누르면 그 진동 하나만 울린다
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { HapticCheckScreen } from './HapticCheckScreen';

const mocks = vi.hoisted(() => ({
  haptic: vi.fn(),
  hapticRhythm: vi.fn(() => () => {}),
}));

// 실제 화면은 각 화면의 테스트가 본다 — 여기서는 어느 리듬의 화면을 여는지만 본다
vi.mock('./RhythmPreview', () => ({
  RhythmPreview: ({ rhythm }: { rhythm: string }) => <p>미리보기 {rhythm}</p>,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/shared/haptics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/haptics')>()),
  haptic: mocks.haptic,
  hapticRhythm: mocks.hapticRhythm,
}));

const signIn = (role?: 'USER' | 'ADMIN') =>
  useAuthStore.getState().setAuth('access', 'refresh', {
    userId: 1,
    nickname: '준서',
    email: null,
    provider: 'kakao',
    role,
  });

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
  mocks.haptic.mockClear();
  mocks.hapticRhythm.mockClear();
});

describe('HapticCheckScreen', () => {
  it('진동 칸을 누르면 그 진동이 울린다', () => {
    signIn('ADMIN');
    render(<HapticCheckScreen />);

    fireEvent.click(screen.getByRole('button', { name: /^축하/ }));

    expect(mocks.haptic).toHaveBeenCalledWith('celebrate');
  });

  it('큰 순간 줄을 누르면 그 순간의 리듬이 울린다', () => {
    signIn('ADMIN');
    render(<HapticCheckScreen />);

    fireEvent.click(
      screen.getByRole('button', { name: /오늘 열매가 채워질 때/ }),
    );

    expect(mocks.hapticRhythm).toHaveBeenCalledWith('rise');
  });

  it('리듬 카드를 누르면 그 리듬을 쓰는 실제 화면이 뜬다', () => {
    signIn('ADMIN');
    render(<HapticCheckScreen />);

    fireEvent.click(screen.getByRole('button', { name: /^차오름/ }));

    expect(screen.getByText('미리보기 rise')).toBeInTheDocument();
  });

  it('상황 줄을 누르면 그 순간의 진동이 울린다', () => {
    signIn('ADMIN');
    render(<HapticCheckScreen />);

    fireEvent.click(screen.getByRole('button', { name: /못 알아들었을 때/ }));

    expect(mocks.haptic).toHaveBeenCalledWith('warning');
  });

  it('누르는 칸은 누름 진동이 겹치지 않게 전역 진동에서 빠진다', () => {
    signIn('ADMIN');
    render(<HapticCheckScreen />);

    expect(screen.getByRole('button', { name: /^축하/ })).toHaveAttribute(
      'data-no-haptic',
    );
  });

  it('USER면 안내만 보인다', () => {
    signIn('USER');
    render(<HapticCheckScreen />);

    expect(
      screen.getByText('ADMIN 계정에서만 볼 수 있어요'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^축하/ })).toBeNull();
  });
});
