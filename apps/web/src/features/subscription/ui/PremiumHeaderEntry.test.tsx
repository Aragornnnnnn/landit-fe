// 헤더 왼쪽 자리 — 언제 알약이고 언제 로고인지, 할인 중에는 무엇을 보여주는지
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '../api/subscription';
import { PremiumHeaderEntry } from './PremiumHeaderEntry';

const mocks = vi.hoisted(() => ({
  paymentLive: true,
  subscription: null as MySubscription | null,
}));

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('../model/usePaymentLive', () => ({
  usePaymentLive: () => mocks.paymentLive,
}));
vi.mock('../model/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => ({ subscription: mocks.subscription }),
}));
vi.mock('../model/useOfferings', () => ({
  useOfferings: () => ({ list: {}, promo: {} }),
}));
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const free = (promo: MySubscription['promo'] = null): MySubscription => ({
  premium: false,
  subscriptionStatus: 'NONE',
  periodType: null,
  expiresAt: null,
  promo,
});

beforeEach(() => {
  mocks.paymentLive = true;
  mocks.subscription = free();
});
afterEach(() => cleanup());

describe('PremiumHeaderEntry', () => {
  it('무료 사용자에게는 프리미엄 진입 알약을 보여준다', () => {
    render(<PremiumHeaderEntry />);

    expect(screen.getByText('시작하기')).toBeInTheDocument();
  });

  it('할인 중에는 남은 시간을 보여준다', () => {
    mocks.subscription = free({
      remainingSeconds: 165,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
      campaignKey: 'exit-5min-2026-09',
    });
    render(<PremiumHeaderEntry />);

    expect(screen.getByText('02:45')).toBeInTheDocument();
  });

  it('유료 사용자에게는 로고를 그린다 — 팔 것이 없다', () => {
    mocks.subscription = { ...free(), premium: true };
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });

  it('결제를 시킬 수 없는 환경에서도 로고를 그린다 — 눌러도 살 수 없다', () => {
    mocks.paymentLive = false;
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });
});
