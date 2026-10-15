// 앱 헤더 왼쪽 자리 검증 — 환급 참여자는 금액 알약, 그 밖에는 프리미엄 진입에 무엇을 끼울지
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  endedRewardView,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { AppHeader } from './AppHeader';

const mocks = vi.hoisted(() => ({
  my: { reward: null as unknown, invited: false, settled: true },
  entry: null as {
    holding?: boolean;
    invite?: { href: string; onClick?: () => void };
  } | null,
  // 환급을 권할 사람이 대화를 끝내고 돌아온 순간의 연출 — 훅이 정한 것을 헤더가 그대로 그리는지만 본다
  missed: {
    entryRef: () => {},
    dailyWon: 500,
    pillWon: null as number | null,
    shower: null as { pill: DOMRect; onLand: () => void } | null,
    endShower: () => {},
    bubble: null as { pill: DOMRect; onClose: () => void } | null,
  },
}));
const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));

vi.mock('../_model/useMyReward', () => ({ useMyReward: () => mocks.my }));
vi.mock('../_model/useMissedEarnInvite', () => ({
  useMissedEarnInvite: () => mocks.missed,
}));
vi.mock('@/features/reward/ui/common/MissedEarnShower', () => ({
  MissedEarnShower: () => <span data-testid="missed-shower" />,
}));
vi.mock('@/features/reward/ui/RewardInviteBubble', () => ({
  RewardInviteBubble: () => <span data-testid="invite-bubble" />,
}));
vi.mock('@/features/subscription/ui/PremiumHeaderEntry', () => ({
  PremiumHeaderEntry: (props: {
    holding?: boolean;
    invite?: { href: string; onClick?: () => void; label?: React.ReactNode };
  }) => {
    mocks.entry = props;
    return <span data-testid="premium-entry">{props.invite?.label}</span>;
  },
  PREMIUM_ENTRY_PILL_CLASS: '',
}));
vi.mock('@/features/reward/ui/HeaderReward', () => ({
  HeaderReward: ({ badge }: { badge: { label: string } }) => (
    <span data-testid="reward-pill">{badge.label}</span>
  ),
  RewardInviteLabel: ({ amountWon }: { amountWon?: number | null }) => (
    <span data-testid="invite-label">{amountWon ?? '평소'}</span>
  ),
}));
vi.mock('@/features/streak/ui/HeaderStreak', () => ({
  HeaderStreak: () => null,
}));
vi.mock('@/features/mailbox/ui/MailboxButton', () => ({
  MailboxButton: () => null,
}));
vi.mock('@/shared/ui/HeaderAction', () => ({ HeaderAction: () => null }));

beforeEach(() => {
  mocks.my = { reward: null, invited: false, settled: true };
  mocks.entry = null;
  mocks.missed = {
    ...mocks.missed,
    pillWon: null,
    shower: null,
    bubble: null,
  };
});
afterEach(cleanup);

describe('AppHeader', () => {
  it('환급 참여자에게는 로고 자리에 금액 알약을 놓는다', () => {
    mocks.my = { reward: rewardView(), invited: false, settled: true };

    render(<AppHeader />);

    expect(screen.getByTestId('reward-pill')).toHaveTextContent('쌓인 환급액');
    expect(screen.queryByTestId('premium-entry')).not.toBeInTheDocument();
  });

  it('끝났고 돌려받을 금액도 없으면 원래의 프리미엄 진입으로 돌아간다', () => {
    mocks.my = { reward: endedRewardView(0), invited: false, settled: true };

    render(<AppHeader />);

    expect(screen.getByTestId('premium-entry')).toBeInTheDocument();
  });

  it('환급을 권할 사람의 진입은 환급 소개로 돌린다', () => {
    mocks.my = { reward: null, invited: true, settled: true };

    render(<AppHeader />);

    expect(mocks.entry?.invite?.href).toBe('/reward');
  });

  it('권할 사람이 그 진입을 누르면 헤더에서 환급으로 들어갔다고 찍는다', () => {
    mocks.my = { reward: null, invited: true, settled: true };
    render(<AppHeader />);

    mocks.entry?.invite?.onClick?.();

    expect(analytics.track.mock.calls).toEqual([
      ['Reward Entry Tapped', { source: 'header' }],
    ]);
  });

  it('누구인지 아직 모르면 진입을 붙들어 둔다', () => {
    mocks.my = { reward: null, invited: false, settled: false };

    render(<AppHeader />);

    expect(mocks.entry?.holding).toBe(true);
  });

  it('권할 사람의 알약은 평소에는 금액을 말하지 않는다', () => {
    mocks.my = { reward: null, invited: true, settled: true };

    render(<AppHeader />);

    expect(screen.getByTestId('invite-label')).toHaveTextContent('평소');
    expect(screen.queryByTestId('missed-shower')).not.toBeInTheDocument();
  });

  it('권할 사람이 오늘의 시나리오를 끝내고 돌아오면 동전 연출을 틀고, 닿은 뒤에는 알약이 그 금액을 말한다', () => {
    mocks.my = { reward: null, invited: true, settled: true };
    mocks.missed = {
      ...mocks.missed,
      pillWon: 500,
      shower: { pill: new DOMRect(), onLand: () => {} },
    };

    render(<AppHeader />);

    expect(screen.getByTestId('missed-shower')).toBeInTheDocument();
    expect(screen.getByTestId('invite-label')).toHaveTextContent('500');
  });

  it('말풍선은 훅이 띄우라고 할 때만 그린다 — 한 번만 보여 주는 판단은 훅이 한다', () => {
    mocks.my = { reward: null, invited: true, settled: true };
    mocks.missed = {
      ...mocks.missed,
      bubble: { pill: new DOMRect(), onClose: () => {} },
    };

    render(<AppHeader />);

    expect(screen.getByTestId('invite-bubble')).toBeInTheDocument();
  });
});
