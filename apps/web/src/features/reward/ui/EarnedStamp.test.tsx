// 대화 완료 직후 받은 금액 도장 — 동전이 닿는 순간에 축하 진동이 한 번 울리는지 검증
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { haptic } from '@/shared/haptics';

import { EarnedStamp } from './EarnedStamp';

vi.mock('@/shared/haptics', () => ({ haptic: vi.fn() }));
// next/image는 next 밑의 react 복사본을 잡아 훅 dispatcher가 null이 된다 (HeaderReward 테스트와 같은 이유)
vi.mock('next/image', () => ({ default: () => <span /> }));

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => reducedMotion.value,
}));

describe('EarnedStamp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    reducedMotion.value = false;
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('동전이 떨어져 닿는 순간 celebrate를 한 번 울린다', () => {
    render(<EarnedStamp earn={{ earnedWon: 300 }} />);
    expect(haptic).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1000));

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('celebrate');
  });

  it('동작 줄이기를 켰으면 떨어지는 연출이 없으니 기다리지 않고 바로 celebrate를 울린다 — 받은 건 같은 성취다', () => {
    reducedMotion.value = true;
    render(<EarnedStamp earn={{ earnedWon: 300 }} />);

    act(() => vi.advanceTimersByTime(0));

    expect(haptic).toHaveBeenCalledTimes(1);
    expect(haptic).toHaveBeenCalledWith('celebrate');
  });

  it('닿기 전에 화면을 떠나면 울리지 않는다', () => {
    const { unmount } = render(<EarnedStamp earn={{ earnedWon: 300 }} />);

    unmount();
    act(() => vi.advanceTimersByTime(1000));

    expect(haptic).not.toHaveBeenCalled();
  });
});
