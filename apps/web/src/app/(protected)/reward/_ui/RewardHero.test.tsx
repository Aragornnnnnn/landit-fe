// 환급 히어로 계측 — 기간이 끝난 사람의 다시 시작 카드가 환급에서 페이월로 들어간 것으로 찍히는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  endedRewardView,
  rewardToday,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { RewardHero } from './RewardHero';

const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));
// next/link·next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderReward 테스트와 같은 이유)
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<'a'>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));
const clock = vi.hoisted(() => ({ urgent: false }));
vi.mock('@/features/reward/model/useMidnightUrgent', () => ({
  useMidnightUrgent: (enabled: boolean) => enabled && clock.urgent,
}));

const zone = vi.hoisted(() => ({ outside: false }));
vi.mock('@/features/reward/model/useOutsideKoreaTime', () => ({
  useOutsideKoreaTime: () => zone.outside,
}));

afterEach(() => {
  cleanup();
  clock.urgent = false;
  zone.outside = false;
});

describe('RewardHero 계측', () => {
  it('기간이 끝난 사람이 다시 시작을 누르면 환급에서 페이월로 들어갔다고 찍는다', () => {
    render(<RewardHero reward={endedRewardView(31_920)} />);

    fireEvent.click(screen.getByRole('link', { name: /다시 시작하기/ }));

    expect(analytics.track.mock.calls).toEqual([
      ['Paywall Entry Tapped', { source: 'reward' }],
    ]);
  });

  it('아직 새 챌린지를 살 수 없으면 다시 시작 카드를 내지 않는다', () => {
    render(
      <RewardHero
        reward={{ ...endedRewardView(31_920), purchaseAvailable: false }}
      />,
    );

    expect(screen.queryByRole('link', { name: /다시 시작하기/ })).toBeNull();
  });

  it('쌓는 중인 사람에게는 다시 시작 카드가 없다', () => {
    render(<RewardHero reward={rewardView()} />);

    expect(screen.queryByRole('link', { name: /다시 시작하기/ })).toBeNull();
  });
});

describe('RewardHero 자정 시계', () => {
  it('기기가 한국 시각이 아니면 시계 아래에 오늘의 시나리오가 한국 시각 자정에 바뀐다고 알린다', () => {
    clock.urgent = true;
    zone.outside = true;
    render(<RewardHero reward={rewardView({ todayMaximumWon: 500 })} />);

    expect(
      screen.getByText('오늘의 시나리오는 한국 시간 자정에 바뀌어요'),
    ).toBeInTheDocument();
  });

  it('기기가 한국 시각이면 마감 안내가 없다', () => {
    clock.urgent = true;
    render(<RewardHero reward={rewardView({ todayMaximumWon: 500 })} />);

    expect(screen.queryByText(/한국 시간/)).not.toBeInTheDocument();
  });

  it('자정이 가까운데 오늘의 시나리오가 아직이면 오늘 몫을 놓치기까지의 시계를 띄운다', () => {
    clock.urgent = true;
    render(<RewardHero reward={rewardView({ todayMaximumWon: 500 })} />);

    expect(screen.getByText(/오늘 500원 놓치기까지/)).toBeInTheDocument();
  });

  it('오늘 몫을 이미 받았으면 자정이 가까워도 시계가 없다', () => {
    clock.urgent = true;
    render(
      <RewardHero
        reward={rewardView({
          todayMaximumWon: 500,
          today: rewardToday({ earnedWon: 500, fullyAchieved: true }),
        })}
      />,
    );

    expect(screen.queryByText(/놓치기까지/)).toBeNull();
  });

  it('기간이 끝난 사람에게는 시계가 없다', () => {
    clock.urgent = true;
    render(<RewardHero reward={endedRewardView(31_920)} />);

    expect(screen.queryByText(/놓치기까지/)).toBeNull();
  });
});
