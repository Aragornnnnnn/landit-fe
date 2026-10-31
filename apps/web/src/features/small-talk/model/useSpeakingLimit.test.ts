// 스몰톡 말하기 한도 — 무료 사용자와 판정 중엔 한도가 있고, 문이 열린 사람만 무제한인지 검증
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSpeakingLimit } from './useSpeakingLimit';

const mocks = vi.hoisted(() => ({
  locked: false,
  deciding: false,
  // 서버의 무료 5분 정책 적용 여부 — null이면 아직 스몰톡 메인을 못 받았다
  trialEnabled: true as boolean | null,
  // 서버가 말한 무제한 여부 — 구독 중이면 true
  serverUnlimited: false,
}));

vi.mock('@/features/subscription/model/paywall-gate/usePaywallGate', () => ({
  usePaywallGate: () => ({ locked: mocks.locked, deciding: mocks.deciding }),
}));

vi.mock('./useSmallTalkMainQuery', () => ({
  useSmallTalkMainQuery: () => ({
    main:
      mocks.trialEnabled === null
        ? null
        : {
            freeTrialEnabled: mocks.trialEnabled,
            unlimited: mocks.serverUnlimited,
          },
  }),
}));

beforeEach(() => {
  mocks.locked = false;
  mocks.deciding = false;
  mocks.trialEnabled = true;
  mocks.serverUnlimited = false;
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

  it('서버가 무료 5분 정책을 아직 안 켰으면 무료 사용자도 한도를 그리지 않는다 — 시작 자체를 페이월이 막는다', () => {
    // Given 정책 적용 시각 전의 무료 사용자
    mocks.locked = true;
    mocks.trialEnabled = false;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 예전처럼 무제한 표시이고, 무료 체험은 꺼져 있다
    expect(result.current).toEqual({ unlimited: true, trialOn: false });
  });

  it('스몰톡 메인을 아직 못 받았으면 무료 체험을 켜지 않는다 — 켜진 줄 알고 문을 먼저 열지 않게', () => {
    // Given 스몰톡 메인을 아직 못 받은 무료 사용자
    mocks.locked = true;
    mocks.trialEnabled = null;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 무료 체험을 켜지 않는다
    expect(result.current.trialOn).toBe(false);
  });

  it('구독 판정 중이어도 서버가 무제한이라 하면 무제한이다 — 구독자에게 잔량 -1이 "0초"로 비치지 않게', () => {
    // Given 정책이 켜졌고 구독을 아직 못 받았지만 서버는 구독자로 본다
    mocks.deciding = true;
    mocks.serverUnlimited = true;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 무제한이다
    expect(result.current.unlimited).toBe(true);
  });
});
