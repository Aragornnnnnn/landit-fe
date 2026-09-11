// PremiumEntry — 무료면 페이월로, 유료면 구독 관리로 가는 골드 한 줄. 결제할 수 없는 환경의 무료 사용자에겐 없다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '@/features/subscription/api/subscription';
import { paywallPath, SUBSCRIPTION_MANAGE_PATH } from '@/shared/lib/routes';

import { PremiumEntry } from './PremiumEntry';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  getNativeContext: vi.fn(),
  query: {
    subscription: null as MySubscription | null,
    isPending: false,
    isError: false,
  },
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: mocks.getNativeContext,
}));
vi.mock('@/features/subscription/model/payment-flag', () => ({
  PAYMENT_ENABLED: true,
}));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({
  useSubscriptionQuery: () => mocks.query,
}));
// next/link는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 — 주소·클릭만 보면 되니 평범한 앵커로 대체한다
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: React.ComponentProps<'a'>) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

const iosShell = {
  platform: 'ios',
  appVersion: '1.3.0',
  buildNumber: '6',
  bridgeVersion: 5,
};

const premium = (overrides: Partial<MySubscription> = {}): MySubscription => ({
  premium: true,
  subscriptionStatus: 'ACTIVE',
  periodType: 'NORMAL',
  expiresAt: '2026-10-04T12:00:00',
  conversationCompletedSinceLaunch: true,
  ...overrides,
});
const setSubscription = (subscription: MySubscription | null) => {
  mocks.query = { subscription, isPending: false, isError: false };
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getNativeContext.mockReturnValue(iosShell);
  setSubscription(premium());
});
afterEach(() => cleanup());

describe('PremiumEntry', () => {
  it('구독 중이면 "이용 중"으로 구독 관리에 들어가고 상태를 남긴다', () => {
    render(<PremiumEntry />);

    const link = screen.getByRole('link', { name: /이용 중/ });
    expect(link).toHaveAttribute('href', SUBSCRIPTION_MANAGE_PATH);
    fireEvent.click(link);
    expect(mocks.track).toHaveBeenCalledWith('Subscription Manage Tapped', {
      status: 'active',
    });
  });

  it('무료 체험 중과 해지 예정은 그 상태를 한 마디로 보여준다', () => {
    setSubscription(premium({ periodType: 'TRIAL' }));
    const { unmount } = render(<PremiumEntry />);
    expect(screen.getByText('체험 중')).toBeInTheDocument();
    unmount();

    setSubscription(premium({ subscriptionStatus: 'CANCELED' }));
    render(<PremiumEntry />);
    expect(screen.getByText('해지 예정')).toBeInTheDocument();
  });

  it('무료 사용자는 결제할 수 있는 셸에서 페이월로 들어가고, 마이페이지로 돌아오게 한다', () => {
    setSubscription(premium({ premium: false, subscriptionStatus: 'NONE' }));
    render(<PremiumEntry />);

    const link = screen.getByRole('link', { name: /구독하기/ });
    expect(link).toHaveAttribute('href', paywallPath({ from: '/me' }));
    fireEvent.click(link);
    expect(mocks.track).toHaveBeenCalledWith('Paywall Entry Tapped', {
      source: 'me',
    });
  });

  it('유료 사용자는 브라우저에서도 카드가 보인다 — 결제 가능 여부는 무료 사용자만 가른다', () => {
    mocks.getNativeContext.mockReturnValue(null);
    render(<PremiumEntry />);
    expect(screen.getByText('이용 중')).toBeInTheDocument();
  });

  it('브라우저나 구버전 셸의 무료 사용자에게는 아무것도 그리지 않는다', () => {
    setSubscription(null);
    mocks.getNativeContext.mockReturnValue(null);
    expect(render(<PremiumEntry />).container).toBeEmptyDOMElement();
  });

  it('구독을 받는 중이거나 실패했으면 그리지 않는다', () => {
    mocks.query = { subscription: null, isPending: true, isError: false };
    const { container, unmount } = render(<PremiumEntry />);
    expect(container).toBeEmptyDOMElement();
    unmount();

    mocks.query = { subscription: null, isPending: false, isError: true };
    expect(render(<PremiumEntry />).container).toBeEmptyDOMElement();
  });
});
