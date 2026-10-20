// 튜토리얼은 키보드로도 넘긴다 — 「다음 문장」 버튼이 쓰는 중인 문장을 끝까지 보여 주고, 다 쓴 문장만 읽어 준다
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TourTutorial } from './TourTutorial';

const mocks = vi.hoisted(() => ({ haptic: vi.fn() }));
vi.mock('@/shared/haptics', () => ({ haptic: mocks.haptic }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mocks.haptic.mockClear();
});

describe('TourTutorial', () => {
  it('「다음 문장」을 누르면 쓰는 중인 문장을 끝까지 보여 주고 그 문장을 한 번 읽어 준다', () => {
    // Given 첫 문장을 쓰기 시작한 튜토리얼
    render(<TourTutorial dailyWon={500} onDone={vi.fn()} />);

    // When 다음 문장 버튼을 누르면
    fireEvent.click(screen.getByRole('button', { name: '다음 문장' }));

    // Then 다 쓴 문장이 읽기 칸에 들어간다 — 대화를 끝낼 때마다 받는다고 말한다
    expect(
      screen.getByText(/방금처럼 대화를 끝낼 때마다\s*500원을 받을 수 있어요/),
    ).toBeInTheDocument();
  });

  it('글자를 한 자 쓸 때마다 가볍게 진동하고, 빈칸에서는 울리지 않는다 — 타자 치는 느낌', () => {
    // Given 첫 문장 「프리미엄 유저라면…」을 쓰기 시작한 튜토리얼
    vi.useFakeTimers();
    render(<TourTutorial dailyWon={500} onDone={vi.fn()} />);

    // When 다섯 자(프·리·미·엄·빈칸)를 쓰는 동안
    for (let i = 0; i < 5; i += 1) act(() => vi.advanceTimersByTime(55));

    // Then 글자 넷만큼만 울린다
    expect(mocks.haptic).toHaveBeenCalledTimes(4);
  });

  it('화면을 눌러 문장을 한 번에 보여 줄 때는 진동하지 않는다', () => {
    render(<TourTutorial dailyWon={500} onDone={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '다음 문장' }));

    expect(mocks.haptic).not.toHaveBeenCalled();
  });
});
