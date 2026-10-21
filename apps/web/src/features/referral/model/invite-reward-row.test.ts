// 친구 초대 화면의 받은 보상 한 줄 규칙 테스트
import { describe, expect, it } from 'vitest';

import type { ReferralReward } from '../api/referral';
import { inviteRewardRowOf } from './invite-reward-row';

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
  // 한국 시각 10월 21일 오후 1시 2분
  createdAt: '2026-10-21T04:02:00Z',
  ...over,
});

describe('inviteRewardRowOf', () => {
  it('적립된 가입 보상은 한국 날짜·시각과 금액을 적는다', () => {
    expect(inviteRewardRowOf(reward({}))).toEqual({
      id: 1,
      dateLabel: '10.21',
      time: '13:02',
      title: '친구가 가입했어요',
      amountLabel: '+3,000원',
      statusLabel: '적립됨',
      settled: true,
    });
  });

  it('결제 보상은 결제했다고 적는다', () => {
    expect(inviteRewardRowOf(reward({ stage: 'PURCHASE' })).title).toBe(
      '친구가 결제했어요',
    );
  });

  it.each([
    ['PENDING', '확인 중'],
    ['REVIEW_REQUIRED', '확인 중'],
    ['REVERSED', '취소됐어요'],
  ] as const)('%s면 「%s」로 흐리게 둔다', (status, label) => {
    const row = inviteRewardRowOf(reward({ status, creditedWon: 0 }));

    expect(row.statusLabel).toBe(label);
    expect(row.settled).toBe(false);
  });

  it('흐린 줄도 확정된 금액을 보여 준다 — 무엇을 기다리는지 알게', () => {
    expect(
      inviteRewardRowOf(reward({ status: 'PENDING', creditedWon: 0 }))
        .amountLabel,
    ).toBe('+3,000원');
  });
});
