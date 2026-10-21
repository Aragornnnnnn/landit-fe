// 초대받은 사람이 받는 금액 규칙 테스트
import { describe, expect, it } from 'vitest';

import type { ReferralStage } from '../api/referral';
import { inviteeWonOf } from './invitee-reward';

const stage = (over: Partial<ReferralStage>): ReferralStage => ({
  enabled: true,
  target: 'BOTH',
  inviterWon: 3000,
  inviteeWon: 3000,
  ...over,
});

describe('inviteeWonOf', () => {
  it.each([
    ['BOTH', 3000],
    ['INVITEE', 3000],
  ] as const)('대상이 %s면 초대받은 사람 몫을 준다', (target, won) => {
    expect(inviteeWonOf(stage({ target }))).toBe(won);
  });

  it('대상이 초대한 사람만이면 초대받은 사람 몫은 0이다', () => {
    expect(inviteeWonOf(stage({ target: 'INVITER', inviteeWon: 0 }))).toBe(0);
  });

  it('단계가 꺼져 있으면 금액이 남아 있어도 0이다', () => {
    expect(inviteeWonOf(stage({ enabled: false }))).toBe(0);
  });
});
