// 프리미엄 프리뷰를 누구에게 여는지 — 판매 규칙이 열라고 한 화면에만, 환급을 팔 때만 환급 문장을 넣어 연다
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePremiumPreview } from './usePremiumPreview';

const mocks = vi.hoisted(() => ({
  offers: { previewFlow: true, rewardSale: true },
  step: 'STARTED',
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ locked: true, deciding: false }),
}));
vi.mock('@/features/subscription/model/offers/useOffers', () => ({
  useOffers: () => mocks.offers,
}));
vi.mock('@/features/premium-preview/model/usePreviewStep', () => ({
  usePreviewStep: () => ({ step: mocks.step, saveStep: vi.fn() }),
}));
vi.mock('@/features/premium-preview/model/preview-replay', () => ({
  isPreviewReplay: () => false,
}));

beforeEach(() => {
  mocks.offers = { previewFlow: true, rewardSale: true };
  mocks.step = 'STARTED';
});

describe('usePremiumPreview', () => {
  it('환급을 팔면 환급을 소개하는 튜토리얼을 연다', () => {
    const { result } = renderHook(() => usePremiumPreview());

    expect(result.current.screen).toBe('tutorial');
    expect(result.current.introducesReward).toBe(true);
  });

  it('프리뷰를 열지 않는 화면에는 열지 않는다', () => {
    mocks.offers = { previewFlow: false, rewardSale: false };

    const { result } = renderHook(() => usePremiumPreview());

    expect(result.current.screen).toBe('none');
  });

  it('환급을 팔지 않으면 환급 없이 튜토리얼을 연다 — 구독만 팔아도 맞춤 표현 소개는 이어진다', () => {
    mocks.offers = { previewFlow: true, rewardSale: false };

    const { result } = renderHook(() => usePremiumPreview());

    expect(result.current.screen).toBe('tutorial');
    expect(result.current.introducesReward).toBe(false);
  });
});
