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
});
