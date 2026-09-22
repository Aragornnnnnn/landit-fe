// 헤더 왼쪽 자리 — 언제 알약이고 언제 로고인지, 할인 중에는 무엇을 보여주는지
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '../api/subscription';
import { clearPromoHandoff, handOffPromo } from '../model/promo-handoff';
import { PremiumHeaderEntry } from './PremiumHeaderEntry';

const mocks = vi.hoisted(() => ({
  paymentLive: true,
  subscription: null as MySubscription | null,
  isPending: false,
  isError: false,
}));

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));
vi.mock('../model/payment-flag', () => ({
  PROMO_ENABLED: true,
  PAYMENT_ENABLED: true,
}));
vi.mock('./PromoSheetHost', () => ({
  PromoSheetHost: ({ open }: { open: boolean }) => (
    <div data-testid="promo-sheet-host" data-open={String(open)} />
  ),
}));
vi.mock('../model/usePaymentLive', () => ({
  usePaymentLive: () => mocks.paymentLive,
}));
vi.mock('../model/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => ({
    subscription: mocks.subscription,
    isPending: mocks.isPending,
    isError: mocks.isError,
  }),
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
  mocks.isPending = false;
  mocks.isError = false;
  clearPromoHandoff();
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

  it('구독 상태를 받는 중이면 로고를 그린다 — 결제한 사람에게 업셀이 잠깐이라도 보이면 안 된다', () => {
    mocks.subscription = null;
    mocks.isPending = true;
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });

  it('구독 조회가 실패해도 로고를 그린다 — 유료인지 모르는 채로 팔지 않는다', () => {
    mocks.subscription = null;
    mocks.isError = true;
    render(<PremiumHeaderEntry />);

    expect(screen.getByLabelText('홈으로')).toBeInTheDocument();
  });

  it('페이월에서 넘겨받으면 시트가 저절로 열린다 — 닫고 홈으로 보낸 뒤 한 번 더 권하는 자리다', () => {
    mocks.subscription = free({
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
      campaignKey: 'exit-5min-2026-09',
    });
    handOffPromo({
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
      campaignKey: 'exit-5min-2026-09',
    });
    render(<PremiumHeaderEntry />);

    expect(screen.getByTestId('promo-sheet-host')).toHaveAttribute(
      'data-open',
      'true',
    );
  });

  it('넘겨받은 게 없으면 시트는 닫힌 채로 붙어만 있다 — 스토어 가격을 미리 받아 둔다', () => {
    mocks.subscription = free({
      remainingSeconds: 300,
      expiresAt: '2026-09-22T14:35:00',
      newUser: true,
      campaignKey: 'exit-5min-2026-09',
    });
    render(<PremiumHeaderEntry />);

    expect(screen.getByTestId('promo-sheet-host')).toHaveAttribute(
      'data-open',
      'false',
    );
  });
});
