// summarizeSubscriptionEvent — 이벤트 타입·사유·금액·통화를 화면 문구로 접는 규칙
import { describe, expect, it } from 'vitest';

import type { SubscriptionEvent } from '../api/subscription';
import { summarizeSubscriptionEvent } from './subscription-events';

const event = (
  overrides: Partial<SubscriptionEvent> = {},
): SubscriptionEvent => ({
  eventId: 'e1',
  type: 'RENEWAL',
  productId: 'com.saynow.app.premium.yearly',
  periodType: 'NORMAL',
  price: 58500,
  currency: 'KRW',
  store: 'APP_STORE',
  environment: 'PRODUCTION',
  cancelReason: null,
  occurredAt: '2026-09-10T03:12:00',
  expiresAt: '2027-09-10T03:12:00',
  ...overrides,
});

describe('summarizeSubscriptionEvent', () => {
  it('갱신 결제는 플랜과 원화 금액을 붙인다', () => {
    expect(summarizeSubscriptionEvent(event())).toEqual({
      title: '갱신 결제',
      plan: '연간 플랜',
      amount: '58,500원',
      sandbox: false,
    });
  });

  it('첫 결제는 체험이면 "무료 체험 시작", 금액 0이면 금액이 없다', () => {
    expect(
      summarizeSubscriptionEvent(
        event({ type: 'INITIAL_PURCHASE', periodType: 'TRIAL', price: 0 }),
      ),
    ).toMatchObject({ title: '무료 체험 시작', amount: null });
    expect(
      summarizeSubscriptionEvent(
        event({
          type: 'INITIAL_PURCHASE',
          periodType: 'NORMAL',
          price: 14900,
          productId: 'com.saynow.app.premium.monthly',
        }),
      ),
    ).toMatchObject({
      title: '첫 결제',
      plan: '월간 플랜',
      amount: '14,900원',
    });
  });

  it('해지는 사유가 고객 지원이면 환불, 아니면 해지 예약이다', () => {
    expect(
      summarizeSubscriptionEvent(
        event({ type: 'CANCELLATION', price: 0, cancelReason: 'UNSUBSCRIBE' }),
      ).title,
    ).toBe('해지 예약');
    expect(
      summarizeSubscriptionEvent(
        event({
          type: 'CANCELLATION',
          price: 0,
          cancelReason: 'CUSTOMER_SUPPORT',
        }),
      ).title,
    ).toBe('환불');
  });

  it('대시보드에서 부여한 무료 이용과 계정 이전도 무슨 일이었는지 말한다', () => {
    expect(
      summarizeSubscriptionEvent(
        event({
          type: 'NON_RENEWING_PURCHASE',
          productId: 'rc_promo_premium_monthly',
          periodType: 'PROMOTIONAL',
          price: null,
        }),
      ),
    ).toMatchObject({ title: '무료 이용 시작', plan: null, amount: null });
    expect(
      summarizeSubscriptionEvent(event({ type: 'TRANSFER', price: null }))
        .title,
    ).toBe('구독 이전');
  });

  it('모르는 종류가 와도 제목이 빈 줄이 되지 않는다', () => {
    expect(
      summarizeSubscriptionEvent(
        event({ type: 'SUBSCRIPTION_PAUSED' as SubscriptionEvent['type'] }),
      ).title,
    ).toBe('구독 상태 변경');
  });

  it('원화가 아니면 통화 코드를 붙이고, 모르는 상품은 플랜이 없고, 샌드박스는 표시한다', () => {
    expect(
      summarizeSubscriptionEvent(
        event({
          price: 5.99,
          currency: 'USD',
          productId: 'com.saynow.app.premium.promo',
          environment: 'SANDBOX',
        }),
      ),
    ).toMatchObject({ plan: null, amount: '5.99 USD', sandbox: true });
  });
});
