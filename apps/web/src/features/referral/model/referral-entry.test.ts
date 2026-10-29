// 온보딩 초대 코드 단계를 열지 판단하는 규칙 테스트 — 등록할 수 있고, 지금 받을 보상이 켜져 있을 때만 연다
import { describe, expect, it } from 'vitest';

import type { ReferralStage, ReferralSummary } from '../api/referral';
import { canEnterReferralStep } from './referral-entry';

const on: ReferralStage = {
  enabled: true,
  target: 'BOTH',
  inviterWon: 1000,
  inviteeWon: 3000,
};
const off: ReferralStage = {
  enabled: false,
  target: 'NONE',
  inviterWon: 0,
  inviteeWon: 0,
};

const summary = (
  registrationStatus: ReferralSummary['registrationStatus'] | undefined,
  signup: ReferralStage,
  purchase: ReferralStage = off,
) =>
  ({
    registrationStatus,
    currentOffer: {
      code: null,
      policyVersion: 1,
      signup,
      purchase,
      purchaseProductNames: [],
    },
  }) as Pick<ReferralSummary, 'registrationStatus' | 'currentOffer'>;

describe('canEnterReferralStep', () => {
  it('등록할 수 있고 가입 보상이 켜져 있으면 연다', () => {
    expect(canEnterReferralStep(summary('PENDING', on), 'ko')).toBe(true);
  });

  it('가입 보상은 꺼져 있어도 결제 보상이 켜져 있으면 연다', () => {
    expect(canEnterReferralStep(summary('PENDING', off, on), 'ko')).toBe(true);
  });

  it('보상이 모두 꺼져 있으면 열지 않는다 — 코드를 넣어도 거절돼 건너뛰기만 남고, 건너뛰면 나중에 켜져도 못 넣는다', () => {
    expect(canEnterReferralStep(summary('PENDING', off), 'ko')).toBe(false);
  });

  it.each(['REGISTERED', 'SKIPPED', 'UNAVAILABLE', undefined] as const)(
    '등록 상태가 %s면 열지 않는다',
    (status) => {
      expect(canEnterReferralStep(summary(status, on), 'ko')).toBe(false);
    },
  );

  it('요약을 아직 못 받았으면 열지 않는다', () => {
    expect(canEnterReferralStep(undefined, 'ko')).toBe(false);
  });

  it('일본어 화면에는 열지 않는다 — 초대 적립금은 환급에 더해지는 한국 전용 혜택이다', () => {
    expect(canEnterReferralStep(summary('PENDING', on), 'ja')).toBe(false);
  });
});
