// 스몰톡 말하기 한도 — 무료 사용자와 판정 중엔 한도가 있고, 문이 열린 사람만 무제한인지 검증
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSpeakingLimit } from './useSpeakingLimit';

const mocks = vi.hoisted(() => ({ locked: false, deciding: false }));

vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ locked: mocks.locked, deciding: mocks.deciding }),
}));

beforeEach(() => {
  mocks.locked = false;
  mocks.deciding = false;
});

describe('useSpeakingLimit', () => {
  it('무료 사용자는 한도가 있다', () => {
    // Given 학습 문이 잠긴 무료 사용자
    mocks.locked = true;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 무제한이 아니다
    expect(result.current.unlimited).toBe(false);
  });

  it('구독을 아직 못 받아 판정 중이면 한도 있음으로 본다 — 무료 사용자에게 무제한·키보드가 잠깐 비치지 않게', () => {
    mocks.deciding = true;

    const { result } = renderHook(() => useSpeakingLimit());

    expect(result.current.unlimited).toBe(false);
  });

  it('잠기지 않은 사용자(구독 중·결제 없는 환경)는 무제한이다', () => {
    const { result } = renderHook(() => useSpeakingLimit());

    expect(result.current.unlimited).toBe(true);
  });
});
