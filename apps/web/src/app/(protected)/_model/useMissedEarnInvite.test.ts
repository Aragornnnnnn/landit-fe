// @vitest-environment jsdom
// 환급을 권할 사람이 오늘의 시나리오를 끝내고 돌아온 순간의 연출 지휘 — 누구에게 트는지, 닿은 뒤 알약이 무엇을 말하는지, 말풍선이 한 번만 뜨는지
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearMissedEarn,
  markMissedEarn,
} from '@/features/reward/model/missed-earn';
import { useAuthStore } from '@/shared/auth/auth-store';

import { inviteBubbleSeen } from './invite-bubble-seen';
import { useMissedEarnInvite } from './useMissedEarnInvite';

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock('motion/react', () => ({ useReducedMotion: () => mocks.reduced }));
vi.mock('./useRewardOffer', () => ({
  useRewardOffer: () => ({ days: 100, dailyWon: 500, maximumWon: 50_000 }),
}));

const USER_ID = 42;
// 지난 31일을 무료로 했고 오늘도 끝냈다
const MISSED = {
  pastDays: 31,
  missedWon: 15_500,
  talkedToday: true,
  dailyWon: 500,
  today: '2026-10-15',
};
// 알약을 감싼 칸이 붙은 것처럼 만든다
const attach = (result: { current: ReturnType<typeof useMissedEarnInvite> }) =>
  act(() => result.current.entryRef(document.createElement('div')));

beforeEach(() => {
  mocks.reduced = false;
  inviteBubbleSeen.clear();
  useAuthStore.setState({
    member: { userId: USER_ID } as never,
    refreshToken: 'token',
  });
});
afterEach(() => {
  cleanup();
  clearMissedEarn();
});

describe('useMissedEarnInvite', () => {
  it('대화를 끝내고 온 것이 아니면 아무것도 틀지 않고 알약도 평소 글자다', () => {
    const { result } = renderHook(() => useMissedEarnInvite(true));
    attach(result);

    expect(result.current.shower).toBeNull();
    expect(result.current.pillWon).toBeNull();
  });

  it('권할 사람이 오늘의 시나리오를 끝내고 왔으면 동전 연출을 튼다', () => {
    markMissedEarn(USER_ID);

    const { result } = renderHook(() => useMissedEarnInvite(true));
    attach(result);

    expect(result.current.shower).not.toBeNull();
    // 닿기 전에는 알약이 아직 평소 글자다
    expect(result.current.pillWon).toBeNull();
  });

  it('권할 사람이 아니면(구독 중 등) 대화를 끝내고 와도 틀지 않는다', () => {
    markMissedEarn(USER_ID);

    const { result } = renderHook(() => useMissedEarnInvite(false));
    attach(result);

    expect(result.current.shower).toBeNull();
  });

  it('동전이 닿으면 알약이 하루 몫을 말하고, 처음에는 말풍선이 뜬다', () => {
    markMissedEarn(USER_ID);
    const { result } = renderHook(() => useMissedEarnInvite(true));
    attach(result);

    act(() => result.current.shower?.onLand());

    expect(result.current.pillWon).toBe(500);
    expect(result.current.bubble).not.toBeNull();
  });

  it('말풍선은 이 기기에서 한 번만 뜬다 — 다음에 동전이 닿을 때는 알약만 바뀐다', () => {
    inviteBubbleSeen.mark();
    markMissedEarn(USER_ID);
    const { result } = renderHook(() => useMissedEarnInvite(true));
    attach(result);

    act(() => result.current.shower?.onLand());

    expect(result.current.pillWon).toBe(500);
    expect(result.current.bubble).toBeNull();
  });

  it('연출이 끝나면 다시 틀지 않지만 알약의 금액은 이 방문 동안 남는다', () => {
    markMissedEarn(USER_ID);
    const { result } = renderHook(() => useMissedEarnInvite(true));
    attach(result);
    act(() => result.current.shower?.onLand());

    act(() => result.current.endShower());

    expect(result.current.shower).toBeNull();
    expect(result.current.pillWon).toBe(500);
  });

  it('지난 2일 이상 놓친 사람은 동전이 닿으면 알약이 놓친 금액을 말한다', () => {
    markMissedEarn(USER_ID);
    const { result } = renderHook(() => useMissedEarnInvite(true, MISSED));
    attach(result);

    act(() => result.current.shower?.onLand());

    expect(result.current.pillWon).toBe(15_500);
    expect(result.current.missed).toBe(true);
  });

  it('놓친 사람에게는 말풍선을 본 적이 있어도 동전이 닿을 때마다 띄운다 — 오늘 몫을 권하는 말이라 날마다 다르다', () => {
    inviteBubbleSeen.mark();
    markMissedEarn(USER_ID);
    const { result } = renderHook(() => useMissedEarnInvite(true, MISSED));
    attach(result);

    act(() => result.current.shower?.onLand());

    expect(result.current.bubble).not.toBeNull();
  });

  it('동작 줄이기를 켠 기기는 연출 없이 알약이 바로 금액을 말한다', () => {
    mocks.reduced = true;
    markMissedEarn(USER_ID);

    const { result } = renderHook(() => useMissedEarnInvite(true));
    attach(result);

    expect(result.current.shower).toBeNull();
    expect(result.current.pillWon).toBe(500);
  });

  it('동작 줄이기를 켠 기기도 놓친 사람에게는 말풍선을 띄운다 — 연출만 건너뛴다', () => {
    mocks.reduced = true;
    markMissedEarn(USER_ID);

    const { result } = renderHook(() => useMissedEarnInvite(true, MISSED));
    attach(result);

    expect(result.current.pillWon).toBe(15_500);
    expect(result.current.bubble).not.toBeNull();
  });

  it('동전이 닿은 뒤 새 값이 와도 이 방문 동안 알약과 말풍선은 닿은 순간의 값을 지킨다', () => {
    // given — 놓친 사람으로 동전이 닿았다
    markMissedEarn(USER_ID);
    const { result, rerender } = renderHook(
      ({ missed }) => useMissedEarnInvite(true, missed),
      { initialProps: { missed: MISSED as typeof MISSED | null } },
    );
    attach(result);
    act(() => result.current.shower?.onLand());

    // when — 다시 받은 요약에서 놓친 환급액이 사라졌다
    rerender({ missed: null });

    expect(result.current.pillWon).toBe(15_500);
    expect(result.current.missed).toBe(true);
  });
});
