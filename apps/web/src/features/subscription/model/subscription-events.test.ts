// describeSubscriptionEvent — 이벤트 타입·사유·금액·통화를 화면 문구로 접는 규칙
import { describe, expect, it } from 'vitest';

import type { SubscriptionEvent } from '../api/subscription';
import { describeSubscriptionEvent } from './subscription-events';

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

describe('describeSubscriptionEvent', () => {
  it('갱신 결제는 플랜과 원화 금액을 붙인다', () => {
    expect(describeSubscriptionEvent(event())).toEqual({
      title: '갱신 결제',
      plan: '연간 플랜',
      amount: '58,500원',
      sandbox: false,
    });
  });

  it('첫 결제는 체험이면 "무료 체험 시작", 금액 0이면 금액이 없다', () => {
    expect(
      describeSubscriptionEvent(
        event({ type: 'INITIAL_PURCHASE', periodType: 'TRIAL', price: 0 }),
      ),
    ).toMatchObject({ title: '무료 체험 시작', amount: null });
    expect(
      describeSubscriptionEvent(
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
      describeSubscriptionEvent(
        event({ type: 'CANCELLATION', price: 0, cancelReason: 'UNSUBSCRIBE' }),
      ).title,
    ).toBe('해지 예약');
    expect(
      describeSubscriptionEvent(
        event({
          type: 'CANCELLATION',
          price: 0,
          cancelReason: 'CUSTOMER_SUPPORT',
        }),
      ).title,
    ).toBe('환불');
  });

  it('원화가 아니면 통화 코드를 붙이고, 모르는 상품은 플랜이 없고, 샌드박스는 표시한다', () => {
    expect(
      describeSubscriptionEvent(
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
