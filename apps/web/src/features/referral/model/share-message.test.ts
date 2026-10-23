// 초대 공유 문구 테스트 — 받는 사람이 메시지를 통째로 붙여넣어도 코드가 찾아지는지가 계약이다
import { describe, expect, it } from 'vitest';

import { findReferralCode } from './referral-code';
import { referralShareMessage } from './share-message';

describe('referralShareMessage', () => {
  it('코드를 「초대 코드:」 한 줄로 넣어 받는 쪽이 통째로 붙여넣어도 찾는다', () => {
    const message = referralShareMessage({
      code: 'K7QM3XPA',
      inviteeSignupWon: 3000,
    });

    expect(message).toContain('\n초대 코드: K7QM3XPA\n');
    expect(findReferralCode(message)).toBe('K7QM3XPA');
  });

  it('받는 사람 몫이 있으면 금액을 적는다', () => {
    const message = referralShareMessage({
      code: 'K7QM3XPA',
      inviteeSignupWon: 3000,
    });

    expect(message).toContain('3,000원이 적립돼요');
  });

  it('받는 사람 몫이 없으면 금액 없이 코드를 넣어 달라고만 한다', () => {
    const message = referralShareMessage({
      code: 'K7QM3XPA',
      inviteeSignupWon: 0,
    });

    expect(message).not.toContain('적립돼요');
  });
});
