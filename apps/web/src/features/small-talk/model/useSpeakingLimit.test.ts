// 스몰톡 말하기 한도 — 무료 5분 정책이 켜졌으면 서버가 말한 무제한 여부를 따르고, 꺼졌으면 누구에게나 무제한인지 검증
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSpeakingLimit } from './useSpeakingLimit';

const mocks = vi.hoisted(() => ({
  // 서버의 무료 5분 정책 적용 여부 — null이면 아직 스몰톡 메인을 못 받았다
  trialEnabled: true as boolean | null,
  // 서버가 말한 무제한 여부 — 구독 중이면 true
  serverUnlimited: false,
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
  mocks.trialEnabled = true;
  mocks.serverUnlimited = false;
});

describe('useSpeakingLimit', () => {
  it('정책이 켜졌고 서버가 한도가 있다고 하면 한도를 그린다 — 결제가 없는 환경의 무료 사용자도 같다', () => {
    // Given 서버가 무료 5분을 적용하는 사용자
    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 한도가 있다
    expect(result.current).toEqual({ unlimited: false, trialOn: true });
  });

  it('정책이 켜졌고 서버가 무제한이라 하면 무제한이다 — 구독 판정 중에도 잔량 -1이 "0초"로 비치지 않게', () => {
    // Given 서버가 구독자로 보는 사용자
    mocks.serverUnlimited = true;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 무제한이다
    expect(result.current.unlimited).toBe(true);
  });

  it('서버가 무료 5분 정책을 아직 안 켰으면 누구에게나 무제한 표시다 — 무료 사용자는 시작을 페이월이 막는다', () => {
    // Given 정책 적용 시각 전
    mocks.trialEnabled = false;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 예전처럼 무제한 표시이고, 무료 체험은 꺼져 있다
    expect(result.current).toEqual({ unlimited: true, trialOn: false });
  });

  it('스몰톡 메인을 아직 못 받았으면 무료 체험을 켜지 않는다 — 켜진 줄 알고 문을 먼저 열지 않게', () => {
    // Given 스몰톡 메인을 아직 못 받았다
    mocks.trialEnabled = null;

    // When 한도를 물으면
    const { result } = renderHook(() => useSpeakingLimit());

    // Then 무료 체험을 켜지 않는다
    expect(result.current.trialOn).toBe(false);
  });
});
