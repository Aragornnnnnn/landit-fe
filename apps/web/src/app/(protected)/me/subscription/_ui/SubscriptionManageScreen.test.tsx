// SubscriptionManageScreen — 플랜 붙은 상태 제목, 결제일·결제 금액 행, 혜택, 맨 아래 해지 링크. 유료가 아니면 페이월 안내만
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MySubscription } from '@/features/subscription/api/subscription';

import { SubscriptionManageScreen } from './SubscriptionManageScreen';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  getNativeContext: vi.fn(),
  query: {
    subscription: null as MySubscription | null,
    isPending: false,
    isError: false,
  },
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, back: mocks.back }),
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
  it('구독 중이면 다음 결제일과 혜택 다섯 줄, 맨 아래 해지 행을 App Store로 잇는다', () => {
    render(<SubscriptionManageScreen />);

    expect(screen.getByText('프리미엄을 쓰고 있어요')).toBeInTheDocument();
    expect(screen.getByText('다음 결제일')).toBeInTheDocument();
    expect(screen.getByText('2026년 10월 4일')).toBeInTheDocument();
    // 플랜을 모르면 금액 행이 없다
    expect(screen.queryByText('다음 결제 금액')).not.toBeInTheDocument();
    expect(screen.getByText('무제한 프리톡')).toBeInTheDocument();
    const cancel = screen.getByRole('link', { name: '구독 해지하기' });
    expect(cancel).toHaveAttribute(
      'href',
      'https://apps.apple.com/account/subscriptions',
    );
    fireEvent.click(cancel);
    expect(mocks.track).toHaveBeenCalledWith('Store Subscription Tapped', {
      status: 'active',
      action: 'cancel',
    });
  });

  it('무료 체험은 첫 결제일로, 해지 예정은 만료일과 자동 갱신이 꺼졌음을 말한다', () => {
    setSubscription(premium({ periodType: 'TRIAL' }));
    const { unmount } = render(<SubscriptionManageScreen />);
    expect(screen.getByText('무료 체험 중이에요')).toBeInTheDocument();
    expect(screen.getByText('첫 결제일')).toBeInTheDocument();
    unmount();

    setSubscription(premium({ subscriptionStatus: 'CANCELED' }));
    render(<SubscriptionManageScreen />);
    expect(screen.getByText('해지가 예약됐어요')).toBeInTheDocument();
    expect(screen.getByText('해지 취소하기')).toBeInTheDocument();
    expect(
      screen.getByText('2026년 10월 4일 · 자동 갱신 꺼짐'),
    ).toBeInTheDocument();
  });

  it('결제 내역 행이 결제 내역 화면으로 잇고 계측을 남긴다', () => {
    render(<SubscriptionManageScreen />);

    const history = screen.getByRole('link', { name: '결제 내역' });
    expect(history).toHaveAttribute('href', '/me/subscription/history');
    fireEvent.click(history);
    expect(mocks.track).toHaveBeenCalledWith('Subscription History Tapped', {
      status: 'active',
    });
  });

  it('BE가 결제 스토어를 주면 셸 플랫폼과 달라도 그 스토어 링크를 쓴다 — 아이패드·기기 변경', () => {
    mocks.getNativeContext.mockReturnValue({
      platform: 'android',
      appVersion: '1.3.0',
      buildNumber: '6',
      bridgeVersion: 5,
    });
    mocks.query.subscription = {
      ...mocks.query.subscription!,
      store: 'APP_STORE',
    };
    render(<SubscriptionManageScreen />);

    expect(screen.getByRole('link', { name: '구독 해지하기' })).toHaveAttribute(
      'href',
      'https://apps.apple.com/account/subscriptions',
    );
  });

  it('안드로이드 셸이면 해지 행이 Google Play로 간다', () => {
    mocks.getNativeContext.mockReturnValue({
      platform: 'android',
      appVersion: '1.3.0',
      buildNumber: '6',
      bridgeVersion: 5,
    });
    render(<SubscriptionManageScreen />);

    expect(screen.getByRole('link', { name: '구독 해지하기' })).toHaveAttribute(
      'href',
      'https://play.google.com/store/account/subscriptions',
    );
  });

  it('BE가 상품 식별자를 주면 제목에 플랜을 붙이고 결제 금액 행을 적는다 — 연간은 월간 1년치를 지운 혜택가', () => {
    mocks.query.subscription = {
      ...mocks.query.subscription!,
      productId: 'com.saynow.app.premium.yearly',
    };
    render(<SubscriptionManageScreen />);

    expect(screen.getByText('연간 프리미엄을 쓰고 있어요')).toBeInTheDocument();
    expect(screen.getByText('다음 결제 금액')).toBeInTheDocument();
    expect(screen.getByText('178,800원')).toBeInTheDocument();
    expect(screen.getByText('58,500원')).toBeInTheDocument();
  });

  it('월간은 비교가 없이 금액만 적는다', () => {
    mocks.query.subscription = {
      ...mocks.query.subscription!,
      productId: 'com.saynow.app.premium.monthly',
    };
    render(<SubscriptionManageScreen />);

    expect(screen.getByText('월간 프리미엄을 쓰고 있어요')).toBeInTheDocument();
    expect(screen.getByText('14,900원')).toBeInTheDocument();
    expect(screen.queryByText('178,800원')).not.toBeInTheDocument();
  });

  it('유료가 아니면 페이월로 안내한다', () => {
    setSubscription(premium({ premium: false, subscriptionStatus: 'EXPIRED' }));
    render(<SubscriptionManageScreen />);

    expect(
      screen.getByRole('link', { name: /프리미엄 구독하기/ }),
    ).toHaveAttribute('href', '/paywall?from=%2Fme');
    expect(screen.queryByText('무제한 프리톡')).not.toBeInTheDocument();
  });

  it('받는 중이거나 실패했으면 아무것도 그리지 않는다 — 유료 사용자에게 무료 안내를 잘못 보여주지 않는다', () => {
    mocks.query = { subscription: null, isPending: true, isError: false };
    const { unmount } = render(<SubscriptionManageScreen />);
    expect(screen.queryByText(/프리미엄/)).not.toBeInTheDocument();
    unmount();

    mocks.query = { subscription: null, isPending: false, isError: true };
    render(<SubscriptionManageScreen />);
    expect(screen.queryByText(/구독 중이 아니에요/)).not.toBeInTheDocument();
  });

  it('뒤로 가기는 밀고 들어온 마이페이지로 한 칸 돌아가고, 바로 들어왔으면 /me로 보낸다', () => {
    render(<SubscriptionManageScreen />);
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    // jsdom은 히스토리가 한 장이라 딥링크 진입과 같다
    expect(mocks.replace).toHaveBeenCalledWith('/me');

    vi.spyOn(window.history, 'length', 'get').mockReturnValue(2);
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(mocks.back).toHaveBeenCalledTimes(1);
  });
});
