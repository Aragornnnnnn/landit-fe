// 환급이 열린 환경 판정 — 스위치와 셸의 플랫폼·앱 버전을 같이 본다
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRewardChallengeLive } from './useRewardChallengeLive';

const mocks = vi.hoisted(() => ({
  getNativeContext: vi.fn(),
  rewardEnabled: true,
}));

vi.mock('@/shared/bridge/native-context', () => ({
  getNativeContextSnapshot: mocks.getNativeContext,
}));
vi.mock('./payment-flag', () => ({
  get REWARD_CHALLENGE_ENABLED() {
    return mocks.rewardEnabled;
  },
}));

const shell = (appVersion: string) => ({
  platform: 'ios',
  appVersion,
  buildNumber: '18',
  bridgeVersion: 8,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rewardEnabled = true;
  mocks.getNativeContext.mockReturnValue(shell('1.4.0'));
});

describe('useRewardChallengeLive', () => {
  it('스위치가 켜져 있고 환급 상품이 실린 앱이면 환급이 열린다', () => {
    const { result } = renderHook(() => useRewardChallengeLive());

    expect(result.current).toBe(true);
  });

  it('환급 상품이 실리기 전 앱에서는 열리지 않는다', () => {
    mocks.getNativeContext.mockReturnValue(shell('1.3.3'));

    const { result } = renderHook(() => useRewardChallengeLive());

    expect(result.current).toBe(false);
  });

  it('스위치가 꺼져 있으면 열리지 않는다', () => {
    mocks.rewardEnabled = false;

    const { result } = renderHook(() => useRewardChallengeLive());

    expect(result.current).toBe(false);
  });
});
