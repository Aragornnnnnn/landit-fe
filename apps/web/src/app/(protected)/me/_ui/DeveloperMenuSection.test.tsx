// 개발자 묶음 — ADMIN 계정에만 보이고 알람 점검 화면으로 들어간다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { DeveloperMenuSection } from './DeveloperMenuSection';

// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 평범한 앵커로 대체한다
const mocks = vi.hoisted(() => ({ startTourPreview: vi.fn() }));

vi.mock('next/link', () => ({
  default: ({ href, children, onClick }: React.ComponentProps<'a'>) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock('@/features/tour/model/tour-preview', () => ({
  startTourPreview: mocks.startTourPreview,
}));
vi.mock('@/features/alarm/model/useAlarmStatus', () => ({
  useAlarmStatus: () => null,
}));
vi.mock('@/features/alarm/model/useAlarmSettingQuery', () => ({
  useAlarmSettingQuery: () => ({ data: undefined }),
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
});

describe('DeveloperMenuSection', () => {
  it('ADMIN이면 개발자 묶음이 보인다', () => {
    signIn('ADMIN');

    render(<DeveloperMenuSection />);

    expect(screen.getByText('개발자')).toBeInTheDocument();
    expect(screen.getByText('알람 점검').closest('a')).toHaveAttribute(
      'href',
      '/me/developer',
    );
    expect(screen.getByText('환급 점검').closest('a')).toHaveAttribute(
      'href',
      '/me/developer/reward',
    );
  });

  it('ADMIN이면 첫 대화 뒤 튜토리얼과 환급 페이월을 다시 볼 수 있다', () => {
    signIn('ADMIN');

    render(<DeveloperMenuSection />);

    expect(screen.getByText('튜토리얼 보기').closest('a')).toHaveAttribute(
      'href',
      '/scenario',
    );
    expect(screen.getByText('환급 페이월 보기').closest('a')).toHaveAttribute(
      'href',
      '/me/developer/reward-paywall',
    );
  });

  it('튜토리얼 보기를 누르면 이 계정의 첫 대화 뒤 투어를 처음부터 다시 켠다', () => {
    signIn('ADMIN');
    render(<DeveloperMenuSection />);

    fireEvent.click(screen.getByText('튜토리얼 보기'));

    expect(mocks.startTourPreview).toHaveBeenCalledWith(1);
  });

  it.each([['USER' as const], [undefined]])(
    'role이 %s이면 보이지 않는다',
    (role) => {
      signIn(role);

      render(<DeveloperMenuSection />);

      expect(screen.queryByText('개발자')).not.toBeInTheDocument();
    },
  );
});
