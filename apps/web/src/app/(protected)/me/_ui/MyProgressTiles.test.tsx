// 내 정보 맨 위 타일 검증 — 환급이 열리기 전에는 자리가 없고, 열린 뒤에는 사람에 따라 환급 타일이 갈린다
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rewardView } from '@/features/reward/model/reward.fixture';

import { MyProgressTiles } from './MyProgressTiles';

const mocks = vi.hoisted(() => ({
  launched: true,
  streak: {
    streak: null as { currentStreakDays: number } | null,
    isPending: false,
  },
  my: { reward: null as unknown, invited: false, settled: true },
  streakAsked: 0,
}));

vi.mock('@/features/subscription/model/paywall-gate/payment-flag', () => ({
  get REFUND_CHALLENGE_ENABLED() {
    return mocks.launched;
  },
}));
vi.mock('@/features/streak/model/useStreakQuery', () => ({
  useStreakQuery: () => {
    mocks.streakAsked += 1;
    return mocks.streak;
  },
}));
vi.mock('../../_model/useMyReward', () => ({ useMyReward: () => mocks.my }));
// next/link·next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderStreak 테스트와 같은 이유)
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));

const links = () =>
  screen.queryAllByRole('link').map((link) => link.getAttribute('href'));

beforeEach(() => {
  mocks.launched = true;
  mocks.streak = { streak: { currentStreakDays: 6 }, isPending: false };
  mocks.my = { reward: null, invited: false, settled: true };
  mocks.streakAsked = 0;
});
afterEach(cleanup);

describe('MyProgressTiles', () => {
  it('환급이 열리기 전에는 아무것도 그리지 않고 조회도 하지 않는다', () => {
    mocks.launched = false;

    render(<MyProgressTiles />);

    expect(links()).toEqual([]);
    expect(mocks.streakAsked).toBe(0);
  });

  it('참여자에게는 쌓인 금액과 연속 학습을 나란히 놓는다', () => {
    mocks.my = { reward: rewardView(), invited: false, settled: true };

    render(<MyProgressTiles />);

    expect(links()).toEqual(['/refund', '/streak']);
    expect(screen.getByText('12,300원')).toBeInTheDocument();
  });

  it('권할 사람에게는 최대 금액으로 환급을 소개한다', () => {
    mocks.my = { reward: null, invited: true, settled: true };

    render(<MyProgressTiles />);

    expect(screen.getByText('환급 최대')).toBeInTheDocument();
    expect(screen.getByText('59,900원')).toBeInTheDocument();
  });

  it('환급과 상관없는 사람에게는 연속 학습만 놓는다', () => {
    render(<MyProgressTiles />);

    expect(links()).toEqual(['/streak']);
  });

  it('누구인지 다 알기 전에는 그리지 않는다', () => {
    mocks.my = { reward: null, invited: false, settled: false };

    render(<MyProgressTiles />);

    expect(links()).toEqual([]);
  });

  it('스트릭을 받지 못해도 환급 타일은 보여 준다', () => {
    mocks.streak = { streak: null, isPending: false };
    mocks.my = { reward: rewardView(), invited: false, settled: true };

    render(<MyProgressTiles />);

    expect(links()).toEqual(['/refund', '/streak']);
    expect(screen.getByText('0일')).toBeInTheDocument();
  });
});
