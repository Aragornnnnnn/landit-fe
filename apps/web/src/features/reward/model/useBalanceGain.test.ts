// 늘어난 환급액 훅의 계약 테스트 — 헤더가 새로 붙을 때마다 그사이 늘어난 만큼을 알려 준다
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { forgetSeenBalance } from './seen-balance';
import { useBalanceGain, usePendingGain } from './useBalanceGain';

const mocks = vi.hoisted(() => ({ reduced: false }));

vi.mock('@/shared/auth/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ member: { userId: 42 } }),
}));
vi.mock('motion/react', () => ({ useReducedMotion: () => mocks.reduced }));

// 헤더가 붙어 금액을 보여 준다. 연출이 있으면 끝까지 본다
const visit = (balanceWon: number | null, outsider = balanceWon === null) => {
  const { result, unmount } = renderHook(() =>
    useBalanceGain(balanceWon, outsider),
  );
  const gain = result.current.gain;
  act(() => result.current.endGain());
  unmount();
  return gain;
};

beforeEach(() => {
  forgetSeenBalance();
  mocks.reduced = false;
});

describe('useBalanceGain', () => {
  it('앱을 새로 열었을 때는 이미 쌓인 금액을 받은 것처럼 알리지 않는다', () => {
    expect(visit(2015)).toBe(null);
  });

  it('학습을 끝내고 돌아오면 그사이 늘어난 만큼을 알린다', () => {
    visit(2015);

    expect(visit(2347)).toEqual({ fromWon: 2015, toWon: 2347 });
  });

  it('돌아온 뒤에 새 금액이 도착해도 알린다', () => {
    // given — 돌아온 순간에는 아직 옛 금액이다
    visit(2015);
    const { result, rerender } = renderHook(
      ({ balanceWon }) => useBalanceGain(balanceWon, false),
      { initialProps: { balanceWon: 2015 } },
    );

    rerender({ balanceWon: 2347 });

    expect(result.current.gain).toEqual({ fromWon: 2015, toWon: 2347 });
  });

  it('연출이 끝나면 더 알리지 않는다', () => {
    visit(2015);
    const { result } = renderHook(() => useBalanceGain(2347, false));

    act(() => result.current.endGain());

    expect(result.current.gain).toBe(null);
  });

  it('연출을 다 보지 못하고 떠났으면 돌아왔을 때 다시 알린다', () => {
    visit(2015);
    renderHook(() => useBalanceGain(2347, false)).unmount();

    expect(visit(2347)).toEqual({ fromWon: 2015, toWon: 2347 });
  });

  it('환급과 상관없던 사람이 참여자가 되면 처음 쌓인 금액도 알린다', () => {
    // given — 무료 유저로 홈을 봤다
    visit(null);

    expect(visit(111)).toEqual({ fromWon: 0, toWon: 111 });
  });

  it('상관없는 사람으로 확인되지 않았으면 0원을 본 것으로 적지 않는다', () => {
    // given — 조회가 실패했거나, 참여자인데 결제 확인 중이라 금액이 없다. 나중에 뜬 금액 전부가 방금 받은 것처럼 보이면 안 된다
    visit(null, false);

    expect(visit(2015)).toBe(null);
  });

  it('동작 줄이기를 켰으면 알리지 않고 바로 본 것으로 적는다', () => {
    visit(2015);
    mocks.reduced = true;
    expect(visit(2347)).toBe(null);

    mocks.reduced = false;

    expect(visit(2347)).toBe(null);
  });
});

describe('usePendingGain', () => {
  it('헤더의 연출이 끝나면 다른 화면도 같이 안다', () => {
    // given — 홈 화면은 연출이 남아 있는 동안 시트를 미룬다
    visit(2015);
    const header = renderHook(() => useBalanceGain(2347, false));
    const home = renderHook(() => usePendingGain(2347));
    expect(home.result.current).not.toBe(null);

    act(() => header.result.current.endGain());

    expect(home.result.current).toBe(null);
  });
});
