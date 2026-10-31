// 프리미엄 프리뷰를 누구에게 여는지 — 한국어 화면은 환급을 팔 수 있을 때만, 일본어 화면은 환급 문장 없이 늘 연다
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setTestLocale } from '@/shared/i18n/test-locale';

import { usePremiumPreview } from './usePremiumPreview';

const mocks = vi.hoisted(() => ({ rewardLive: true, step: 'STARTED' }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ locked: true, deciding: false }),
}));
vi.mock(
  '@/features/subscription/model/paywall-gate/useRewardChallengeLive',
  () => ({ useRewardChallengeLive: () => mocks.rewardLive }),
);
vi.mock('@/features/premium-preview/model/usePreviewStep', () => ({
  usePreviewStep: () => ({ step: mocks.step, saveStep: vi.fn() }),
}));
vi.mock('@/features/premium-preview/model/preview-replay', () => ({
  isPreviewReplay: () => false,
}));

beforeEach(() => {
  mocks.rewardLive = true;
  mocks.step = 'STARTED';
});

describe('usePremiumPreview', () => {
  it('한국어 화면에서 환급을 팔 수 있으면 환급을 소개하는 튜토리얼을 연다', () => {
    const { result } = renderHook(() => usePremiumPreview());

    expect(result.current.screen).toBe('tutorial');
    expect(result.current.introducesReward).toBe(true);
  });

  it('한국어 화면에서 환급을 팔 수 없으면 열지 않는다', () => {
    mocks.rewardLive = false;

    const { result } = renderHook(() => usePremiumPreview());

    expect(result.current.screen).toBe('none');
  });

  it('일본어 화면은 환급 없이 튜토리얼을 연다 — 구독만 팔아도 맞춤 표현 소개는 이어진다', () => {
    setTestLocale('ja');
    mocks.rewardLive = false;

    const { result } = renderHook(() => usePremiumPreview());

    expect(result.current.screen).toBe('tutorial');
    expect(result.current.introducesReward).toBe(false);
  });
});
