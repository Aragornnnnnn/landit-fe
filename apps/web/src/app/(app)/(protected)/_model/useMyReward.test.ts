// 내 환급 배선 — 환급 조회는 화면 기준(rewardView)으로, 권유는 판매 기준(rewardSale)으로 갈리는지 확인한다
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMyReward } from './useMyReward';

const mocks = vi.hoisted(() => ({
  offers: { rewardView: true, rewardSale: true },
  reward: null as object | null,
  rewardEnabled: undefined as boolean | undefined,
}));

vi.mock('@/features/subscription/model/offers/useOffers', () => ({
  useOffers: () => mocks.offers,
}));
vi.mock('@/features/subscription/model/paywall-gate/usePaymentLive', () => ({
  usePaymentLive: () => true,
}));
vi.mock(
  '@/features/subscription/model/my-subscription/useSubscriptionQuery',
  () => ({
    useSubscriptionQuery: () => ({
      subscription: { premium: false },
      isError: false,
    }),
  }),
);
vi.mock('@/features/reward/model/useRewardQuery', () => ({
  useRewardQuery: ({ enabled }: { enabled: boolean }) => {
    mocks.rewardEnabled = enabled;
    return { reward: mocks.reward, loaded: enabled, fetched: enabled };
  },
}));
vi.mock('@/features/premium-preview/model/preview-replay', () => ({
  isPreviewReplay: () => false,
}));

beforeEach(() => {
  mocks.offers = { rewardView: true, rewardSale: true };
  mocks.reward = null;
});

describe('useMyReward', () => {
  it('환급을 파는 동안에는 환급과 상관없는 무료 유저에게 권한다', () => {
    const { result } = renderHook(() => useMyReward());

    expect(result.current.invited).toBe(true);
  });

  it('판매가 끝나면 무료 유저에게 권하지 않는다', () => {
    mocks.offers = { rewardView: true, rewardSale: false };

    const { result } = renderHook(() => useMyReward());

    expect(result.current.invited).toBe(false);
  });

  it('판매가 끝나도 환급 화면이 열린 곳에서는 환급을 계속 조회해 이미 산 사람의 금액을 돌려준다', () => {
    mocks.offers = { rewardView: true, rewardSale: false };
    mocks.reward = { state: 'ACTIVE' };

    const { result } = renderHook(() => useMyReward());

    expect(mocks.rewardEnabled).toBe(true);
    expect(result.current.reward).toEqual({ state: 'ACTIVE' });
  });

  it('환급 화면이 없는 곳에서는 조회하지 않는다', () => {
    mocks.offers = { rewardView: false, rewardSale: false };

    renderHook(() => useMyReward());

    expect(mocks.rewardEnabled).toBe(false);
  });
});
