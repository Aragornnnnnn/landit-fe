// 환급 화면 계측 — 어떤 상태로 봤는지를 볼 것이 정해진 순간 한 번 찍는지, 소개의 시작 버튼이 페이월 진입으로 찍히는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RewardView } from '@/features/reward/api/reward';
import {
  rewardCycle,
  rewardToday,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { RewardScreen } from './RewardScreen';

const base = {
  reward: null as RewardView | null,
  error: null,
  loaded: true,
  fetching: false,
  invited: false,
  settled: true,
  retry: () => {},
};
const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  replace: vi.fn(),
  my: null as unknown,
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/shared/lib/last-tab', () => ({ homePath: () => '/scenario' }));
vi.mock('../../_model/useMyReward', () => ({ useMyReward: () => mocks.my }));
// 그림은 보지 않는다 — 무엇을 찍는지만 본다
vi.mock('./RewardRecord', () => ({ RewardRecord: () => <p>기록</p> }));
vi.mock('./RewardHistoryFeed', () => ({ RewardHistoryFeed: () => null }));
vi.mock('./RefundApplyButton', () => ({ RefundApplyButton: () => null }));
vi.mock('./RewardSkeleton', () => ({ RewardSkeleton: () => <p>받는 중</p> }));
vi.mock('@/features/reward/ui/RewardGuide', () => ({
  RewardGuide: () => <p>소개</p>,
}));

const kept = () =>
  rewardView({
    current: rewardCycle({ balanceWon: 2015 }),
    today: rewardToday({ earnedWon: 133 }),
  });
const viewed = () =>
  mocks.track.mock.calls.filter(([name]) => name === 'Reward Viewed');

beforeEach(() => {
  mocks.my = base;
});
afterEach(cleanup);

describe('RewardScreen 계측', () => {
  it('참여자가 보면 상태와 쌓인 금액을 한 번 찍는다', () => {
    mocks.my = { ...base, reward: kept() };

    const { rerender } = render(<RewardScreen />);
    rerender(<RewardScreen />);

    expect(viewed()).toEqual([
      ['Reward Viewed', { status: 'kept', balance_won: 2015 }],
    ]);
  });

  it('권할 사람이 보면 소개로 찍는다', () => {
    mocks.my = { ...base, invited: true };

    render(<RewardScreen />);

    expect(viewed()).toEqual([['Reward Viewed', { status: 'intro' }]]);
  });

  it('받는 중에는 찍지 않는다', () => {
    mocks.my = { ...base, loaded: false, settled: false };

    render(<RewardScreen />);

    expect(viewed()).toEqual([]);
  });

  it('받는 중이다가 답이 와서 그려지면 그때 한 번 찍는다', () => {
    mocks.my = { ...base, loaded: false, settled: false };
    const { rerender } = render(<RewardScreen />);

    mocks.my = { ...base, reward: kept() };
    rerender(<RewardScreen />);

    expect(viewed()).toHaveLength(1);
  });

  it('환급과 상관없는 사람은 찍지 않고 홈으로 보낸다', () => {
    render(<RewardScreen />);

    expect(viewed()).toEqual([]);
    expect(mocks.replace).toHaveBeenCalledWith('/scenario');
  });

  it('보는 중에 금액만 바뀌면 다시 찍지 않는다', () => {
    mocks.my = { ...base, reward: kept() };
    const { rerender } = render(<RewardScreen />);

    mocks.my = {
      ...base,
      reward: rewardView({
        current: rewardCycle({ balanceWon: 2126 }),
        today: rewardToday({ earnedWon: 244 }),
      }),
    };
    rerender(<RewardScreen />);

    expect(viewed()).toHaveLength(1);
  });

  it('보는 중에 상태가 바뀌면 다시 찍는다 — 자정을 넘겨 오늘이 다시 아직이 됐다', () => {
    mocks.my = { ...base, reward: kept() };
    const { rerender } = render(<RewardScreen />);

    mocks.my = {
      ...base,
      reward: rewardView({
        current: rewardCycle({ balanceWon: 2126 }),
        today: rewardToday({ earnedWon: 0 }),
      }),
    };
    rerender(<RewardScreen />);

    expect(viewed().at(-1)).toEqual([
      'Reward Viewed',
      { status: 'at_risk', balance_won: 2126 },
    ]);
  });

  it('소개의 시작 버튼은 환급에서 페이월로 들어갔다고 찍는다', () => {
    mocks.my = { ...base, invited: true };
    render(<RewardScreen />);
    mocks.track.mockClear();

    fireEvent.click(
      screen.getByRole('button', { name: '프리미엄 시작하고 환급받기' }),
    );

    expect(mocks.track.mock.calls).toEqual([
      ['Paywall Entry Tapped', { source: 'reward' }],
    ]);
  });
});
