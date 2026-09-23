// BE 구독 응답이 마이페이지의 네 상태로 접히는 규칙
import { describe, expect, it } from 'vitest';

import type { MySubscription } from '../api/subscription';
import { summarizeSubscription } from './subscription-summary';

const premium = (overrides: Partial<MySubscription> = {}): MySubscription => ({
  premium: true,
  subscriptionStatus: 'ACTIVE',
  periodType: 'NORMAL',
  expiresAt: '2026-10-04T12:00:00',
  conversationCompletedSinceLaunch: true,
  ...overrides,
});

describe('summarizeSubscription', () => {
  it('응답이 없거나 유료가 아니면 "없음"이다 — 만료·환불도 마찬가지', () => {
    expect(summarizeSubscription(null)).toEqual({ kind: 'none' });
    expect(
      summarizeSubscription(
        premium({
          premium: false,
          subscriptionStatus: 'EXPIRED',
          periodType: null,
          expiresAt: null,
        }),
      ),
    ).toEqual({ kind: 'none' });
  });

  it('정가·도입가 구독은 "구독 중"이고 만료일에 다시 결제된다', () => {
    expect(summarizeSubscription(premium())).toEqual({
      kind: 'active',
      expiresAt: '2026-10-04T12:00:00',
      renews: true,
      plan: null,
      price: null,
    });
    expect(
      summarizeSubscription(premium({ periodType: 'INTRO' })),
    ).toMatchObject({ renews: true });
  });

  it('무료 체험 중이면 "체험 중"이고 체험이 끝나는 날 첫 결제가 된다', () => {
    expect(summarizeSubscription(premium({ periodType: 'TRIAL' }))).toEqual({
      kind: 'trial',
      expiresAt: '2026-10-04T12:00:00',
      renews: true,
      plan: null,
      price: null,
    });
  });

  it('해지를 예약했으면 체험 중이었더라도 "해지 예정"이고 그날로 끝난다', () => {
    expect(
      summarizeSubscription(
        premium({ subscriptionStatus: 'CANCELED', periodType: 'TRIAL' }),
      ),
    ).toEqual({
      kind: 'canceled',
      expiresAt: '2026-10-04T12:00:00',
      renews: false,
      plan: null,
      price: null,
    });
  });

  it('선결제·프로모션 기간은 "구독 중"이지만 그날로 끝난다 — 기간 종류를 모르면 결제가 이어진다고 말하지 않는다', () => {
    for (const periodType of ['PREPAID', 'PROMOTIONAL', null] as const) {
      expect(summarizeSubscription(premium({ periodType }))).toMatchObject({
        kind: 'active',
        renews: false,
      });
    }
  });

  it('상품 식별자가 있으면 플랜을 같이 준다 — 없으면 null', () => {
    expect(
      summarizeSubscription({
        premium: true,
        subscriptionStatus: 'ACTIVE',
        periodType: 'NORMAL',
        expiresAt: null,
        productId: 'com.saynow.app.premium.yearly',
      }),
    ).toMatchObject({ kind: 'active', plan: 'yearly' });
    expect(
      summarizeSubscription({
        premium: true,
        subscriptionStatus: 'ACTIVE',
        periodType: 'NORMAL',
        expiresAt: null,
      }),
    ).toMatchObject({ plan: null });
  });
});

describe('결제 금액', () => {
  it('앞으로 청구될 원화 금액을 싣는다 — 상품 id로 금액을 추측하지 않는다', () => {
    expect(
      summarizeSubscription(premium({ price: 47000, currency: 'KRW' })),
    ).toMatchObject({ price: 47000 });
  });

  it('금액이 없으면 null이다 — 웹훅이 늦거나 청구가 예정되지 않았을 때', () => {
    expect(summarizeSubscription(premium())).toMatchObject({ price: null });
  });

  it('통화가 안 와도 원화로 본다 — 한국 스토어만 열려 있다', () => {
    expect(summarizeSubscription(premium({ price: 47000 }))).toMatchObject({
      price: 47000,
    });
  });

  it('0원은 청구가 없다는 뜻이라 null이다 — "다음 결제 금액 0원"을 보여주지 않는다', () => {
    expect(
      summarizeSubscription(premium({ price: 0, currency: 'KRW' })),
    ).toMatchObject({ price: null });
  });

  it('외화는 null이다 — 하루 환산·비교가 산식이 원화 기준이라 등록값을 쓴다', () => {
    expect(
      summarizeSubscription(premium({ price: 59.99, currency: 'USD' })),
    ).toMatchObject({ price: null });
  });
});
