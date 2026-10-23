// 초대한 사람이 받는 몫 규칙 테스트 — 정책 금액과 서버 상한(인원·금액·무제한)을 화면이 쓰는 모양으로 바꾼다
import { describe, expect, it } from 'vitest';

import type { ReferralInviterLimit, ReferralStage } from '../api/referral';
import { inviteOfferOf, inviterWonOf } from './inviter-reward';

const stage = (over: Partial<ReferralStage> = {}): ReferralStage => ({
  enabled: true,
  target: 'BOTH',
  inviterWon: 1000,
  inviteeWon: 3000,
  ...over,
});

const purchaseOff: ReferralStage = {
  enabled: false,
  target: 'NONE',
  inviterWon: 0,
  inviteeWon: 0,
};

const summary = (
  signup: ReferralStage,
  inviterLimit: ReferralInviterLimit,
) => ({
  currentOffer: {
    code: null,
    policyVersion: 1,
    signup,
    purchase: purchaseOff,
    purchaseProductNames: [],
  },
  inviterLimit,
});

const limit = (
  type: ReferralInviterLimit['type'],
  value: number | null,
): ReferralInviterLimit => ({ type, value, used: null, remaining: null });

describe('inviterWonOf', () => {
  it.each(['BOTH', 'INVITER'] as const)(
    '대상이 %s면 초대한 사람 몫을 준다',
    (target) => {
      expect(inviterWonOf(stage({ target }))).toBe(1000);
    },
  );

  it.each([
    ['초대받은 사람만', stage({ target: 'INVITEE' })],
    ['단계가 꺼져 있으면', stage({ enabled: false })],
  ])('%s 0이다', (_, given) => {
    expect(inviterWonOf(given)).toBe(0);
  });
});

describe('inviteOfferOf', () => {
  it('인원 상한이면 그 인원과, 인원 × 한 명당 금액을 최대 금액으로 준다', () => {
    expect(inviteOfferOf(summary(stage(), limit('INVITE_COUNT', 10)))).toEqual({
      inviterWon: 1000,
      inviteeWon: 3000,
      limitCount: 10,
      maxWon: 10000,
    });
  });

  it('금액 상한이면 그 금액을 최대로, 한 명당 금액으로 나눈 몫을 인원으로 준다', () => {
    expect(
      inviteOfferOf(summary(stage(), limit('TOTAL_AMOUNT', 5500))),
    ).toMatchObject({ limitCount: 5, maxWon: 5500 });
  });

  it('무제한이면 인원·최대 금액을 비운다 — 진행 막대를 그리지 않는다', () => {
    expect(
      inviteOfferOf(summary(stage(), limit('UNLIMITED', null))),
    ).toMatchObject({ limitCount: null, maxWon: null });
  });

  it('초대한 사람 몫이 없으면 null이다 — 초대 자리를 숨긴다', () => {
    expect(
      inviteOfferOf(
        summary(stage({ target: 'INVITEE' }), limit('INVITE_COUNT', 10)),
      ),
    ).toBeNull();
  });
});
