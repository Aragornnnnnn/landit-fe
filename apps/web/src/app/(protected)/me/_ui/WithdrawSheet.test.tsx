// WithdrawSheet — 자동 갱신 중인 구독이 있으면 탈퇴 버튼 대신 구독 관리로 보낸다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '@/features/subscription/api/subscription';

import { WithdrawSheet } from './WithdrawSheet';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  query: {
    subscription: null as MySubscription | null,
    isPending: false,
    isError: false,
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => mocks.query,
}));
vi.mock('motion/react', () => import('@/shared/motion/test-double'));

const premium = (overrides: Partial<MySubscription> = {}): MySubscription => ({
  premium: true,
  subscriptionStatus: 'ACTIVE',
  periodType: 'NORMAL',
  expiresAt: '2026-10-04T12:00:00',
  ...overrides,
});

const renderSheet = () =>
  render(
    <WithdrawSheet
      open
      deleting={false}
      errorMessage={null}
      onClose={vi.fn()}
      onConfirm={vi.fn()}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.subscription = null;
});
afterEach(cleanup);

describe('WithdrawSheet', () => {
  it('구독이 없으면 탈퇴 버튼을 보여준다', () => {
    renderSheet();

    expect(
      screen.getByRole('button', { name: '탈퇴할게요' }),
    ).toBeInTheDocument();
  });

  it('자동 갱신 중인 구독(구독 중·체험 중)이면 탈퇴 대신 구독 관리로 보낸다', () => {
    mocks.query.subscription = premium();
    renderSheet();

    expect(
      screen.queryByRole('button', { name: '탈퇴할게요' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '구독 관리로 가기' }));
    expect(mocks.push).toHaveBeenCalledWith('/me/subscription');
  });

  it('해지 예약(자동 갱신 꺼짐)은 막지 않는다 — 남은 기간을 버리는 건 본인 선택이다', () => {
    mocks.query.subscription = premium({ subscriptionStatus: 'CANCELED' });
    renderSheet();

    expect(
      screen.getByRole('button', { name: '탈퇴할게요' }),
    ).toBeInTheDocument();
  });
});
