// SubscriptionHistoryScreen — 이력 줄 구성, 빈·실패 안내, 뒤로가기
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubscriptionEvent } from '@/features/subscription/api/subscription';

import { SubscriptionHistoryScreen } from './SubscriptionHistoryScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  query: {
    events: [] as SubscriptionEvent[],
    isPending: false,
    isError: false,
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, back: mocks.back }),
}));
vi.mock('@/features/subscription/model/useSubscriptionEventsQuery', () => ({
  useSubscriptionEventsQuery: () => mocks.query,
}));

const event = (overrides: Partial<SubscriptionEvent>): SubscriptionEvent => ({
  eventId: 'e',
  type: 'RENEWAL',
  productId: 'com.saynow.app.premium.yearly',
  periodType: 'NORMAL',
  price: 58500,
  currency: 'KRW',
  store: 'APP_STORE',
  environment: 'PRODUCTION',
  cancelReason: null,
  occurredAt: '2026-09-10T03:12:00',
  expiresAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.events = [];
  mocks.query.isPending = false;
  mocks.query.isError = false;
});
afterEach(cleanup);

describe('SubscriptionHistoryScreen', () => {
  it('이력마다 무슨 일·플랜·날짜와 금액을 한 줄로 보여준다', () => {
    mocks.query.events = [
      event({ eventId: '1' }),
      event({
        eventId: '2',
        type: 'INITIAL_PURCHASE',
        periodType: 'TRIAL',
        price: 0,
        occurredAt: '2026-09-03T03:12:00',
        environment: 'SANDBOX',
      }),
    ];
    render(<SubscriptionHistoryScreen />);

    expect(screen.getByText('갱신 결제 · 연간 플랜')).toBeInTheDocument();
    expect(screen.getByText('2026년 9월 10일')).toBeInTheDocument();
    expect(screen.getByText('58,500원')).toBeInTheDocument();
    expect(screen.getByText(/무료 체험 시작 · 연간 플랜/)).toBeInTheDocument();
    expect(screen.getByText('테스트')).toBeInTheDocument();
  });

  it('비어 있으면 아직 없다고, 실패하면 못 불러왔다고 말한다', () => {
    const { unmount } = render(<SubscriptionHistoryScreen />);
    expect(screen.getByText('아직 결제 내역이 없어요')).toBeInTheDocument();
    unmount();

    mocks.query.isError = true;
    render(<SubscriptionHistoryScreen />);
    expect(
      screen.getByText('결제 내역을 불러오지 못했어요'),
    ).toBeInTheDocument();
  });

  it('뒤로가기는 한 칸 뒤로, 돌아갈 곳이 없으면 구독 관리로', () => {
    vi.spyOn(window.history, 'length', 'get').mockReturnValue(1);
    render(<SubscriptionHistoryScreen />);

    fireEvent.click(screen.getByRole('button', { name: /뒤로/ }));

    expect(mocks.replace).toHaveBeenCalledWith('/me/subscription');
  });
});
