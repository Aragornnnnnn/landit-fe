// 초대한 사람이 받는 몫 규칙 테스트
import { describe, expect, it } from 'vitest';

import type { ReferralReward, ReferralStage } from '../api/referral';
import {
  earnedByInvitingOf,
  inviteHeadlineOf,
  inviteOfferOf,
  inviterWonOf,
  REFERRAL_INVITE_LIMIT,
} from './inviter-reward';

const reward = (over: Partial<ReferralReward>): ReferralReward => ({
  id: 1,
  referralId: 1,
  policyVersion: 1,
  recipientId: 42,
  stage: 'SIGNUP',
  recipientRole: 'INVITER',
  amountWon: 3000,
  creditedWon: 3000,
  status: 'CREDITED',
  reason: null,
  createdAt: '2026-10-21T04:00:00Z',
  ...over,
});

describe('inviterWonOf', () => {
  const stage = (over: Partial<ReferralStage>): ReferralStage => ({
    enabled: true,
    target: 'BOTH',
    inviterWon: 3000,
    inviteeWon: 3000,
    ...over,
  });

  it.each(['BOTH', 'INVITER'] as const)(
    '대상이 %s면 초대한 사람 몫을 준다',
    (target) => {
      expect(inviterWonOf(stage({ target }))).toBe(3000);
    },
  );

  it('대상이 초대받은 사람만이면 0이다', () => {
    expect(inviterWonOf(stage({ target: 'INVITEE', inviterWon: 0 }))).toBe(0);
  });

  it('단계가 꺼져 있으면 0이다', () => {
    expect(inviterWonOf(stage({ enabled: false }))).toBe(0);
  });
});

describe('earnedByInvitingOf', () => {
  it('초대한 사람으로 실제 적립된 순액만 더한다', () => {
    const rewards = [
      reward({ id: 1, creditedWon: 3000 }),
      reward({ id: 2, stage: 'PURCHASE', creditedWon: 5000 }),
      // 내가 초대받아 받은 몫은 「초대로 받은 돈」이 아니다
      reward({ id: 3, recipientRole: 'INVITEE', creditedWon: 3000 }),
      // 검토 중이라 아직 안 들어왔다
      reward({ id: 4, status: 'REVIEW_REQUIRED', creditedWon: 0 }),
    ];

    expect(earnedByInvitingOf(rewards)).toBe(8000);
  });
});

describe('inviteOfferOf', () => {
  const offer = (signup: Partial<ReferralStage>) => ({
    signup: {
      enabled: true,
      target: 'BOTH' as const,
      inviterWon: 1000,
      inviteeWon: 3000,
      ...signup,
    },
  });

  it('친구가 내 코드로 가입하면 둘이 받는 금액과 상한까지의 최대 금액을 준다', () => {
    expect(inviteOfferOf(offer({}))).toEqual({
      inviterWon: 1000,
      inviteeWon: 3000,
      maxWon: 1000 * REFERRAL_INVITE_LIMIT,
    });
  });

  it('초대받은 사람 몫이 없어도 초대한 사람 몫이 있으면 연다', () => {
    expect(inviteOfferOf(offer({ target: 'INVITER' }))).toEqual({
      inviterWon: 1000,
      inviteeWon: 0,
      maxWon: 10000,
    });
  });

  it('초대한 사람 몫이 없으면 null이다 — 초대 자리를 숨긴다', () => {
    expect(inviteOfferOf(offer({ enabled: false }))).toBeNull();
    expect(inviteOfferOf(offer({ target: 'INVITEE' }))).toBeNull();
  });
});

describe('inviteHeadlineOf', () => {
  const offer = (signupWon: number, purchaseWon: number) => ({
    signup: {
      enabled: signupWon > 0,
      target: signupWon > 0 ? ('BOTH' as const) : ('NONE' as const),
      inviterWon: signupWon,
      inviteeWon: signupWon,
    },
    purchase: {
      enabled: purchaseWon > 0,
      target: purchaseWon > 0 ? ('BOTH' as const) : ('NONE' as const),
      inviterWon: purchaseWon,
      inviteeWon: purchaseWon,
    },
  });

  it('가입 보상이 있으면 가입 금액으로 부른다', () => {
    expect(inviteHeadlineOf(offer(3000, 5000))).toBe('친구 초대하면 3,000원');
  });

  it('결제 보상만 있으면 결제 금액으로 부른다', () => {
    expect(inviteHeadlineOf(offer(0, 5000))).toBe('친구가 결제하면 5,000원');
  });

  it('초대한 사람 몫이 하나도 없으면 null이다 — 초대 자리를 숨긴다', () => {
    expect(inviteHeadlineOf(offer(0, 0))).toBeNull();
  });
});
