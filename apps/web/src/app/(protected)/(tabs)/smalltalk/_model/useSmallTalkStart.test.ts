// 스몰톡 시작 문 — 무료 5분 정책이 켜졌으면 바로 들이고, 꺼졌거나 다 썼으면 페이월 게이트를 거치는지 검증
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SMALLTALK_PATH } from '@/shared/lib/routes';

import { useSmallTalkStart } from './useSmallTalkStart';

const mocks = vi.hoisted(() => ({ guard: vi.fn() }));

vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ guard: mocks.guard }),
}));

beforeEach(() => {
  mocks.guard.mockClear();
});

const paywallOptions = { source: 'smalltalk', returnTo: SMALLTALK_PATH };

describe('useSmallTalkStart', () => {
  it('무료 5분 정책이 켜졌고 남은 시간이 있으면 게이트 없이 바로 들어간다', () => {
    // Given 정책이 켜진 서버, 남은 시간이 있다
    const go = vi.fn();
    const { result } = renderHook(() =>
      useSmallTalkStart({ trialOn: true, exhausted: false }),
    );

    // When 시작하면
    result.current(go);

    // Then 페이월을 거치지 않고 대화로 간다
    expect(go).toHaveBeenCalledOnce();
    expect(mocks.guard).not.toHaveBeenCalled();
  });

  it('무료 5분을 다 썼으면 대화로 가지 않고 페이월을 연다 — 시작 버튼은 그대로 두고 누르면 구독을 권한다', () => {
    // Given 무료 5분을 다 쓴 무료 사용자
    const go = vi.fn();
    const { result } = renderHook(() =>
      useSmallTalkStart({ trialOn: true, exhausted: true }),
    );

    // When 시작하면
    result.current(go);

    // Then 대화로 가지 않고 페이월 게이트에 맡긴다
    expect(go).not.toHaveBeenCalled();
    expect(mocks.guard).toHaveBeenCalledWith(
      expect.any(Function),
      paywallOptions,
    );
    expect(mocks.guard.mock.calls[0][0]).not.toBe(go);
  });

  it('정책이 꺼져 있으면 페이월 게이트를 거친다 — 서버가 무료 사용자의 스몰톡을 막는 동안', () => {
    // Given 정책 적용 시각 전의 서버
    const go = vi.fn();
    const { result } = renderHook(() =>
      useSmallTalkStart({ trialOn: false, exhausted: false }),
    );

    // When 시작하면
    result.current(go);

    // Then 페이월 게이트에 맡긴다
    expect(mocks.guard).toHaveBeenCalledWith(go, paywallOptions);
    expect(go).not.toHaveBeenCalled();
  });
});
