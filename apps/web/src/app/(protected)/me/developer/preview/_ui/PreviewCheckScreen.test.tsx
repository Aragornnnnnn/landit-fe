// 프리뷰 점검 — 첫 대화 뒤 레벨 결과부터, 또는 홈 프리뷰의 단계를 골라 이 계정으로 다시 본다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PreviewCheckScreen } from './PreviewCheckScreen';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  startPreviewReplay: vi.fn(),
  markMissedEarn: vi.fn(),
  isAdmin: true,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, back: vi.fn(), replace: vi.fn() }),
}));
// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({ href, children, onClick }: React.ComponentProps<'a'>) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('motion/react', () => import('@/shared/motion/test-double'));
vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('@/shared/auth/current-member', () => ({
  useIsAdmin: () => mocks.isAdmin,
}));
// zustand 훅은 자기 밑 react 복사본을 잡아 렌더러와 어긋난다 — 선택자만 흉내 낸다
vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 1, nickname: '준서' } }),
}));
vi.mock('@/features/premium-preview/model/preview-replay', () => ({
  startPreviewReplay: mocks.startPreviewReplay,
}));
vi.mock('@/features/reward/model/missed-earn', () => ({
  markMissedEarn: mocks.markMissedEarn,
}));

afterEach(() => {
  cleanup();
  mocks.push.mockClear();
  mocks.startPreviewReplay.mockClear();
  mocks.markMissedEarn.mockClear();
  mocks.isAdmin = true;
});

describe('PreviewCheckScreen', () => {
  it.each([
    ['튜토리얼부터', 'STARTED'],
    ['카드 뒤집기부터', 'TUTORIAL_DONE'],
    ['무료 표현부터', 'CARD_FLIPPED'],
  ])(
    '「%s」를 누르면 그 단계부터 이어 보도록 미리보기를 켜고 홈으로 간다',
    (title, step) => {
      render(<PreviewCheckScreen />);

      const link = screen.getByText(title).closest('a')!;
      fireEvent.click(link);

      expect(link).toHaveAttribute('href', '/scenario');
      expect(mocks.startPreviewReplay).toHaveBeenCalledWith(1, step);
    },
  );

  it('「레벨 결과부터」는 첫 대화 직후 레벨 결과를 보여 주고, 버튼을 누르면 튜토리얼부터 이어 홈으로 간다', () => {
    render(<PreviewCheckScreen />);

    fireEvent.click(screen.getByText('레벨 결과부터'));
    fireEvent.click(
      screen.getByRole('button', { name: '랜딧으로 영어 공부 시작하기' }),
    );

    expect(mocks.startPreviewReplay).toHaveBeenCalledWith(1, 'STARTED');
    expect(mocks.push).toHaveBeenCalledWith('/scenario');
  });

  it('튜토리얼부터 보면 오늘 시나리오를 막 끝낸 것처럼 홈에서 동전이 알약으로 쌓이는 연출부터 튼다', () => {
    render(<PreviewCheckScreen />);

    fireEvent.click(screen.getByText('튜토리얼부터').closest('a')!);

    expect(mocks.markMissedEarn).toHaveBeenCalledWith(1);
  });

  it('카드 뒤집기부터 보면 동전 연출은 건너뛴다 — 실제로도 튜토리얼 앞에서만 나온다', () => {
    render(<PreviewCheckScreen />);

    fireEvent.click(screen.getByText('카드 뒤집기부터').closest('a')!);

    expect(mocks.markMissedEarn).not.toHaveBeenCalled();
  });

  it('ADMIN이 아니면 단계 목록을 보여 주지 않는다', () => {
    mocks.isAdmin = false;

    render(<PreviewCheckScreen />);

    expect(screen.queryByText('튜토리얼부터')).not.toBeInTheDocument();
    expect(
      screen.getByText('ADMIN 계정에서만 볼 수 있어요'),
    ).toBeInTheDocument();
  });
});
