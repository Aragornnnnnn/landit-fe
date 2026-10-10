// 동전 연출 동안 시트를 붙잡는 판정의 계약 테스트 — 홈의 시트는 돌아온 순간의 연출이 끝난 뒤에 뜬다
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  endedRewardView,
  rewardView,
} from '@/features/reward/model/reward.fixture';

import { useEarnShowerHold } from './useEarnShowerHold';

const mocks = vi.hoisted(() => ({
  my: { reward: null as unknown, fetching: false },
  gain: null as { fromWon: number; toWon: number } | null,
}));

vi.mock('../../_model/useMyReward', () => ({ useMyReward: () => mocks.my }));
vi.mock('@/features/reward/model/useBalanceGain', () => ({
  usePendingGain: () => mocks.gain,
}));

const GAIN = { fromWon: 2015, toWon: 2347 };

beforeEach(() => {
  mocks.my = { reward: rewardView(), fetching: false };
  mocks.gain = null;
});

describe('useEarnShowerHold', () => {
  it('연출할 금액이 남아 있으면 시트를 붙잡는다', () => {
    mocks.gain = GAIN;

    expect(renderHook(() => useEarnShowerHold()).result.current).toBe(true);
  });

  it('참여자의 환급을 다시 받는 중이면 붙잡는다', () => {
    // given — 늘어난 금액이 곧 도착할 수 있다
    mocks.my = { reward: rewardView(), fetching: true };

    expect(renderHook(() => useEarnShowerHold()).result.current).toBe(true);
  });

  it('연출할 것도 받는 중인 것도 없으면 붙잡지 않는다', () => {
    mocks.my = { reward: endedRewardView(31920), fetching: false };

    expect(renderHook(() => useEarnShowerHold()).result.current).toBe(false);
  });

  it('환급과 상관없는 사람은 받는 중이어도 붙잡지 않는다', () => {
    mocks.my = { reward: null, fetching: true };

    expect(renderHook(() => useEarnShowerHold()).result.current).toBe(false);
  });

  it('연출이 끝나면 놓아준다', () => {
    mocks.gain = GAIN;
    const { result, rerender } = renderHook(() => useEarnShowerHold());

    mocks.gain = null;
    rerender();

    expect(result.current).toBe(false);
  });

  it('한 번 놓아준 뒤에는 환급을 다시 받아도 붙잡지 않는다', () => {
    // given — 시트가 떠 있는데 앱에 돌아와 환급을 다시 받는다. 떠 있던 시트가 닫혔다 열리면 안 된다
    const { result, rerender } = renderHook(() => useEarnShowerHold());
    expect(result.current).toBe(false);

    mocks.my = { reward: rewardView(), fetching: true };
    rerender();

    expect(result.current).toBe(false);
  });
});
