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
  entry: null as { holding?: boolean; invite?: { href: string } } | null,
}));

vi.mock('../_model/useMyReward', () => ({ useMyReward: () => mocks.my }));
vi.mock('@/features/subscription/ui/PremiumHeaderEntry', () => ({
  PremiumHeaderEntry: (props: {
    holding?: boolean;
    invite?: { href: string };
  }) => {
    mocks.entry = props;
    return <span data-testid="premium-entry" />;
  },
}));
vi.mock('@/features/reward/ui/HeaderRefund', () => ({
  HeaderRefund: ({ badge }: { badge: { label: string } }) => (
    <span data-testid="refund-pill">{badge.label}</span>
  ),
  RefundInviteLabel: () => null,
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
});
afterEach(cleanup);

describe('AppHeader', () => {
  it('환급 참여자에게는 로고 자리에 금액 알약을 놓는다', () => {
    mocks.my = { reward: rewardView(), invited: false, settled: true };

    render(<AppHeader />);

    expect(screen.getByTestId('refund-pill')).toHaveTextContent('쌓인 환급액');
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

    expect(mocks.entry?.invite?.href).toBe('/refund');
  });

  it('누구인지 아직 모르면 진입을 붙들어 둔다', () => {
    mocks.my = { reward: null, invited: false, settled: false };

    render(<AppHeader />);

    expect(mocks.entry?.holding).toBe(true);
  });
});
