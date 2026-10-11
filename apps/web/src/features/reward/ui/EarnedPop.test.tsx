// 받은 금액 알림 검증 — 누를 수 없는 알림이라 저절로 걷히지 않으면 화면에 남는다
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useEarnedPop } from '../model/earned-pop';
import { rewardReceipt } from '../model/reward.fixture';
import { EarnedPop } from './EarnedPop';

// 움직임은 여기서 볼 것이 아니다 — 나가는 연출을 기다리지 않게 바로 그리고 바로 걷는다
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children }: React.ComponentProps<'div'>) => <div>{children}</div>,
    span: ({ children }: React.ComponentProps<'span'>) => (
      <span>{children}</span>
    ),
  },
}));
vi.mock('next/image', () => ({ default: () => <span /> }));

beforeEach(() => {
  vi.useFakeTimers();
  useEarnedPop.setState({ shown: null, announced: [] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('EarnedPop', () => {
  it('받은 금액을 띄우고 읽어 준다', () => {
    render(<EarnedPop />);

    act(() => useEarnedPop.getState().show(rewardReceipt({ earnedWon: 11 })));

    expect(screen.getByText('+11원')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '환급액 11원을 받았어요',
    );
  });

  it('잠깐 뒤 저절로 걷힌다', () => {
    render(<EarnedPop />);
    act(() => useEarnedPop.getState().show(rewardReceipt({ earnedWon: 11 })));

    act(() => vi.advanceTimersByTime(1700));

    expect(screen.queryByText('+11원')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
