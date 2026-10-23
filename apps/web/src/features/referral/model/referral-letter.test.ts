// 친구 초대 안내 편지 판별 테스트 — env에 적힌 편지 id(쉼표로 여럿 가능)와 같을 때만
import { describe, expect, it } from 'vitest';

import { isReferralLetter } from './referral-letter';

describe('isReferralLetter', () => {
  it('설정한 편지 id와 같으면 친구 초대 안내 편지다', () => {
    expect(isReferralLetter(12, '12')).toBe(true);
    expect(isReferralLetter(13, '12')).toBe(false);
  });

  it('쉼표로 여러 id를 적으면 그중 하나면 된다', () => {
    expect(isReferralLetter(7, '12, 7,30')).toBe(true);
  });

  it('설정이 비어 있으면 어떤 편지에도 붙지 않는다', () => {
    expect(isReferralLetter(12, '')).toBe(false);
    expect(isReferralLetter(12, undefined)).toBe(false);
  });
});
