// SubscriptionManageScreen — 상태별 제목·날짜 줄, 혜택, 스토어 링크와 환불 링크. 유료가 아니면 페이월 안내만
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '@/features/subscription/api/subscription';

import { SubscriptionManageScreen } from './SubscriptionManageScreen';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  replace: vi.fn(),
  getNativeContext: vi.fn(),
  query: {
    subscription: null as MySubscription | null,
    isPending: false,
    isError: false,
  },
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: mocks.getNativeContext,
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
  mocks.getNativeContext.mockReturnValue({
    platform: 'ios',
    appVersion: '1.3.0',
    buildNumber: '6',
    bridgeVersion: 5,
  });
  setSubscription(premium());
});
afterEach(() => cleanup());

describe('SubscriptionManageScreen', () => {
  it('구독 중이면 다음 결제일과 혜택 다섯 줄, App Store 구독 관리 링크를 보여준다', () => {
    render(<SubscriptionManageScreen />);

    expect(screen.getByText('프리미엄을 쓰고 있어요')).toBeInTheDocument();
    expect(screen.getByText('다음 결제일 2026년 10월 4일')).toBeInTheDocument();
    expect(screen.getByText('무제한 프리톡')).toBeInTheDocument();
    const store = screen.getByRole('link', { name: 'App Store에서 구독 관리' });
    expect(store).toHaveAttribute(
      'href',
      'https://apps.apple.com/account/subscriptions',
    );
    fireEvent.click(store);
    expect(mocks.track).toHaveBeenCalledWith('Store Subscription Tapped', {
      status: 'active',
    });
  });

  it('무료 체험은 첫 결제일로, 해지 예정은 만료일과 자동 갱신이 꺼졌음을 말한다', () => {
    setSubscription(premium({ periodType: 'TRIAL' }));
    const { unmount } = render(<SubscriptionManageScreen />);
    expect(screen.getByText('무료 체험 중이에요')).toBeInTheDocument();
    expect(screen.getByText('첫 결제일 2026년 10월 4일')).toBeInTheDocument();
    unmount();

    setSubscription(premium({ subscriptionStatus: 'CANCELED' }));
    render(<SubscriptionManageScreen />);
    expect(screen.getByText('해지가 예약됐어요')).toBeInTheDocument();
    expect(
      screen.getByText('이용 만료일 2026년 10월 4일 · 자동 갱신 꺼짐'),
    ).toBeInTheDocument();
  });

  it('안드로이드 셸이면 Google Play 링크와 구글 환불 안내로 바꾼다', () => {
    mocks.getNativeContext.mockReturnValue({
      platform: 'android',
      appVersion: '1.3.0',
      buildNumber: '6',
      bridgeVersion: 5,
    });
    render(<SubscriptionManageScreen />);

    expect(
      screen.getByRole('link', { name: 'Google Play에서 구독 관리' }),
    ).toHaveAttribute(
      'href',
      'https://play.google.com/store/account/subscriptions',
    );
    const refund = screen.getByRole('link', { name: '구글 환불 요청 안내' });
    fireEvent.click(refund);
    expect(mocks.track).toHaveBeenCalledWith('Refund Link Tapped', {
      status: 'active',
    });
  });

  it('유료가 아니면 페이월로 안내한다', () => {
    setSubscription(premium({ premium: false, subscriptionStatus: 'EXPIRED' }));
    render(<SubscriptionManageScreen />);

    expect(
      screen.getByRole('link', { name: /프리미엄 구독하기/ }),
    ).toHaveAttribute('href', '/paywall?from=%2Fme');
    expect(screen.queryByText('무제한 프리톡')).not.toBeInTheDocument();
  });

  it('뒤로 가기는 마이페이지로 돌아간다', () => {
    render(<SubscriptionManageScreen />);
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(mocks.replace).toHaveBeenCalledWith('/me');
  });
});
