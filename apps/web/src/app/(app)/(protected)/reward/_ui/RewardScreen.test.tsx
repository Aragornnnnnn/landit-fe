// 환급 화면 계측 — 어떤 상태로 봤는지를 볼 것이 정해진 순간 한 번 찍는지, 소개의 시작 버튼이 페이월 진입으로 찍히는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RewardPreview, RewardView } from '@/features/reward/api/reward';
import {
  rewardCycle,
  rewardToday,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { RewardScreen } from './RewardScreen';

const base = {
  reward: null as RewardView | null,
  preview: null as RewardPreview | null,
  computedAt: '2026-10-15T03:00:00Z' as string | null,
  error: null,
  loaded: true,
  fetching: false,
  invited: false,
  settled: true,
  storedWon: 0,
  retry: () => {},
};
const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  replace: vi.fn(),
  my: null as unknown,
  daily: null as { scenario: { completed: boolean } | null } | null,
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
// 그림(동전)은 보지 않는다
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/shared/lib/last-tab', () => ({ homePath: () => '/scenario' }));
vi.mock('../../_model/useMyReward', () => ({ useMyReward: () => mocks.my }));
// 소개 화면의 금액과 오늘 대화 여부 — 셸과 서버를 부르지 않게 고정한다
vi.mock('../../_model/useRewardOffer', () => ({
  useRewardOffer: () => ({
    days: 100,
    priceWon: 50_000,
    dailyWon: 500,
    maximumWon: 50_000,
  }),
}));
vi.mock('@/features/scenario/model/useDailyScenarioQuery', () => ({
  useDailyScenarioQuery: () => ({ daily: mocks.daily }),
}));
// 그림은 보지 않는다 — 무엇을 찍는지만 본다
vi.mock('./RewardRecord', () => ({ RewardRecord: () => <p>기록</p> }));
vi.mock('./RewardHistoryFeed', () => ({ RewardHistoryFeed: () => null }));
vi.mock('./RefundApplyButton', () => ({ RefundApplyButton: () => null }));
vi.mock('./RewardSkeleton', () => ({ RewardSkeleton: () => <p>받는 중</p> }));
vi.mock('./RewardPot', () => ({ RewardPot: () => null }));
vi.mock('./MissedRewardIntro', () => ({
  MissedRewardIntro: ({ missed }: { missed: { pastDays: number } }) => (
    <p>놓친 {missed.pastDays}일</p>
  ),
}));
vi.mock('@/features/reward/ui/RewardGuide', () => ({
  RewardRuleList: () => <p>규칙</p>,
  SAMPLE_DAYS: 3,
  sampleHistoryOf: () => [],
}));
vi.mock('@/features/reward/ui/RefundDepositDemo', () => ({
  RefundDepositDemo: () => <p>소개</p>,
}));
vi.mock('@/features/reward/ui/RewardHistory', () => ({
  RewardHistory: () => null,
}));

const preview = (patch: Partial<RewardPreview> = {}): RewardPreview => ({
  balanceWon: 1000,
  completedDays: 2,
  todayEarnedWon: 0,
  dailyAmountWon: 500,
  accruing: true,
  ...patch,
});
const kept = () =>
  rewardView({
    current: rewardCycle({ balanceWon: 2015 }),
    today: rewardToday({ earnedWon: 133 }),
  });
const viewed = () =>
  mocks.track.mock.calls.filter(([name]) => name === 'Reward Viewed');

beforeEach(() => {
  mocks.my = base;
  mocks.daily = null;
  localStorage.clear();
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
      { status: 'idle', balance_won: 2126 },
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

  it('무료로 지난 이틀을 한 사람은 소개 대신 놓친 환급액을 보고, 지난 일수를 찍는다', () => {
    // given — 지난 이틀에 오늘까지 했다
    mocks.my = {
      ...base,
      invited: true,
      preview: preview({
        balanceWon: 1500,
        completedDays: 3,
        todayEarnedWon: 500,
      }),
    };

    render(<RewardScreen />);

    expect(screen.getByText('놓친 2일')).toBeInTheDocument();
    expect(viewed().at(-1)).toEqual([
      'Reward Viewed',
      { status: 'intro', past_days: 2 },
    ]);
  });

  it('처음 보는 소개에서 결제 전에 받아 둔 돈이 있으면 보기 내역 대신 이미 쌓인 금액을 보여 준다', () => {
    mocks.my = { ...base, invited: true, storedWon: 3_000 };

    render(<RewardScreen />);

    expect(screen.getByText('이미 이렇게 쌓였어요')).toBeInTheDocument();
    expect(screen.getByText('3,000원')).toBeInTheDocument();
    expect(screen.queryByText('이렇게 쌓여요')).not.toBeInTheDocument();
  });

  it('받아 둔 돈이 없으면 처음 보는 소개는 보기 내역 그대로다', () => {
    mocks.my = { ...base, invited: true };

    render(<RewardScreen />);

    expect(screen.getByText('이렇게 쌓여요')).toBeInTheDocument();
  });

  it('지난 날이 하루뿐이면 처음 보는 소개를 그대로 본다', () => {
    mocks.my = {
      ...base,
      invited: true,
      preview: preview({ completedDays: 2, todayEarnedWon: 500 }),
    };

    render(<RewardScreen />);

    expect(screen.getByText('소개')).toBeInTheDocument();
    expect(screen.queryByText(/^놓친/)).not.toBeInTheDocument();
  });

  describe('결제 전 화면에서 나갈 때', () => {
    const back = () =>
      fireEvent.click(screen.getByRole('button', { name: /뒤로/ }));

    it('뒤로 가면 바로 나가지 않고 신규 회원 특가 시트를 띄우고 한 번 찍는다', () => {
      mocks.my = { ...base, invited: true };
      render(<RewardScreen />);
      mocks.replace.mockClear();

      back();

      expect(screen.getByText('신규 특가로 시작하기')).toBeInTheDocument();
      expect(mocks.replace).not.toHaveBeenCalled();
      expect(
        mocks.track.mock.calls.filter(
          ([name]) => name === 'Reward Exit Offer Viewed',
        ),
      ).toEqual([['Reward Exit Offer Viewed', { status: 'intro' }]]);
    });

    it('「신규 특가로 시작하기」는 결제 금액 안내로 바로 보낸다', () => {
      mocks.my = { ...base, invited: true };
      render(<RewardScreen />);
      back();

      fireEvent.click(
        screen.getByRole('button', { name: '신규 특가로 시작하기' }),
      );

      expect(mocks.replace).toHaveBeenLastCalledWith(
        '/paywall?from=%2Freward&source=reward&step=checkout',
      );
      expect(mocks.track).toHaveBeenCalledWith('Reward Exit Offer Tapped', {
        status: 'intro',
        action: 'start',
      });
    });

    it('「혜택 포기하기」를 누르면 홈으로 나간다', () => {
      mocks.my = { ...base, invited: true };
      render(<RewardScreen />);
      back();

      fireEvent.click(screen.getByRole('button', { name: '혜택 포기하기' }));

      expect(mocks.replace).toHaveBeenLastCalledWith('/scenario');
      expect(mocks.track).toHaveBeenCalledWith('Reward Exit Offer Tapped', {
        status: 'intro',
        action: 'leave',
      });
    });

    it('같은 날 다시 나가면 시트 없이 바로 홈으로 간다', () => {
      mocks.my = { ...base, invited: true };
      const first = render(<RewardScreen />);
      back();
      first.unmount();
      mocks.replace.mockClear();

      render(<RewardScreen />);
      back();

      expect(screen.queryByText('신규 특가로 시작하기')).toBeNull();
      expect(mocks.replace).toHaveBeenCalledWith('/scenario');
    });

    it('참여자는 붙잡지 않고 바로 나간다', () => {
      mocks.my = { ...base, reward: kept() };
      render(<RewardScreen />);

      back();

      expect(screen.queryByText('신규 특가로 시작하기')).toBeNull();
      expect(mocks.replace).toHaveBeenCalledWith('/scenario');
    });
  });

  it('처음 보는 소개(대화 0~2일)는 화면에 같은 그림이 있어 ⓘ를 두지 않는다', () => {
    mocks.my = { ...base, invited: true };
    render(<RewardScreen />);

    expect(screen.queryByRole('button', { name: '환급 규칙' })).toBeNull();
  });
});
