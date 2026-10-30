// 스몰톡 말하기 한도 — 무료 사용자만 남은 시간을 보고, 나머지는 한도 없이 말한다
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useSpeakingLimit } from './useSpeakingLimit';

const mocks = vi.hoisted(() => ({ locked: false }));

vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ locked: mocks.locked }),
}));

describe('useSpeakingLimit', () => {
  it('무료 사용자는 한도가 있다', () => {
    // Given 학습 문이 잠긴 무료 사용자
    mocks.locked = true;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 무제한이 아니다
    expect(result.current.unlimited).toBe(false);
  });

  it('잠기지 않은 사용자(구독 중·결제 없는 환경)는 무제한이다', () => {
    // Given 학습 문이 열린 사용자
    mocks.locked = false;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 무제한이다
    expect(result.current.unlimited).toBe(true);
  });
});
