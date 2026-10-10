// 환급 점검 화면 — ADMIN에게만 케이스를 열어 준다
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { RefundCheckScreen } from './RefundCheckScreen';

const mocks = vi.hoisted(() => ({ caseName: null as string | null }));

// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children }: React.ComponentProps<'a'>) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams(mocks.caseName ? `case=${mocks.caseName}` : ''),
}));
// 고른 케이스의 화면은 실제 부품이 그린다 — 여기서는 어느 케이스를 여는지만 본다
vi.mock('./RefundCheckPreview', () => ({
  RefundCheckPreview: ({ name }: { name: string }) => <p>미리보기 {name}</p>,
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
  mocks.caseName = null;
});

describe('RefundCheckScreen', () => {
  it('ADMIN이면 케이스 목록이 보이고, 케이스는 같은 화면의 ?case=로 열린다', () => {
    signIn('ADMIN');

    render(<RefundCheckScreen />);

    expect(screen.getByText('오늘 다 채움').closest('a')).toHaveAttribute(
      'href',
      '/me/developer/refund?case=full',
    );
  });

  it('ADMIN이 케이스를 고르면 그 케이스를 연다', () => {
    signIn('ADMIN');
    mocks.caseName = 'coin';

    render(<RefundCheckScreen />);

    expect(screen.getByText('미리보기 coin')).toBeInTheDocument();
  });

  it('주소의 케이스가 모르는 값이면 목록을 보여 준다', () => {
    signIn('ADMIN');
    mocks.caseName = '없는-케이스';

    render(<RefundCheckScreen />);

    expect(screen.getByText('오늘 다 채움')).toBeInTheDocument();
  });

  it.each([['USER' as const], [undefined]])(
    'role이 %s이면 주소에 케이스가 있어도 열지 않는다',
    (role) => {
      signIn(role);
      mocks.caseName = 'coin';

      render(<RefundCheckScreen />);

      expect(screen.queryByText('미리보기 coin')).not.toBeInTheDocument();
      expect(
        screen.getByText('ADMIN 계정에서만 볼 수 있어요'),
      ).toBeInTheDocument();
    },
  );
});
