// 구독 응답이 앰플리튜드 유저 속성으로 접히는 규칙
import { describe, expect, it } from 'vitest';

import type { MySubscription } from '../api/subscription';
import {
  toSubscriptionProperties,
  UNKNOWN_SUBSCRIPTION_PROPERTIES,
} from './subscription-properties';

const premium = (overrides: Partial<MySubscription> = {}): MySubscription => ({
  premium: true,
  subscriptionStatus: 'ACTIVE',
  periodType: 'NORMAL',
  expiresAt: '2026-10-04T12:00:00',
  productId: 'com.saynow.app.premium.yearly',
  ...overrides,
});

describe('toSubscriptionProperties', () => {
  it('유료가 아니면 유료 아님과 "구독 없음"을 남기고 플랜은 지운다', () => {
    expect(toSubscriptionProperties(null)).toEqual({
      is_premium: false,
      subscription_state: 'none',
      plan: null,
    });
  });

  it('구독 중이면 유료 여부·상태·플랜이 함께 실린다', () => {
    expect(toSubscriptionProperties(premium())).toEqual({
      is_premium: true,
      subscription_state: 'active',
      plan: 'yearly',
    });
  });

  it('체험 중과 해지 예약은 상태로 갈린다 — 둘 다 아직 유료다', () => {
    expect(
      toSubscriptionProperties(premium({ periodType: 'TRIAL' })),
    ).toMatchObject({
      is_premium: true,
      subscription_state: 'trial',
    });
    expect(
      toSubscriptionProperties(premium({ subscriptionStatus: 'CANCELED' })),
    ).toMatchObject({ is_premium: true, subscription_state: 'canceled' });
  });

  it('상품을 모르면 플랜만 비운다 — 유료 여부는 그대로다', () => {
    expect(toSubscriptionProperties(premium({ productId: null }))).toEqual({
      is_premium: true,
      subscription_state: 'active',
      plan: null,
    });
  });

  it('아직 모르는 구간은 지난 값을 지우고 모른다고만 남긴다', () => {
    expect(UNKNOWN_SUBSCRIPTION_PROPERTIES).toEqual({
      is_premium: null,
      subscription_state: 'unknown',
      plan: null,
    });
  });
});
