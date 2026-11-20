// 친구 초대 대상 배선 — 판매 규칙의 친구 초대 답(referral)이 닫히면 환급 참여자에게도 감추는지 확인한다
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useReferralAudience } from './useReferralAudience';

const mocks = vi.hoisted(() => ({ referral: true }));

vi.mock('@/features/subscription/model/offers/useOffers', () => ({
  useOffers: () => ({ referral: mocks.referral }),
}));
// 환급에 참여한 사람
vi.mock('./useMyReward', () => ({
  useMyReward: () => ({
    invited: false,
    settled: true,
    fetching: false,
    reward: { state: 'ACTIVE' },
  }),
}));

beforeEach(() => {
  mocks.referral = true;
});

describe('useReferralAudience', () => {
  it('친구 초대가 열려 있으면 환급 참여자에게 보인다', () => {
    const { result } = renderHook(() => useReferralAudience());

    expect(result.current.shown).toBe(true);
  });

  it('친구 초대가 닫혔으면 환급 참여자에게도 감춘다', () => {
    mocks.referral = false;

    const { result } = renderHook(() => useReferralAudience());

    expect(result.current).toEqual({ shown: false, settled: true });
  });
});
