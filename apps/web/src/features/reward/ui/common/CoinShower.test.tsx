// 동전 연출 검증 — 그림과 움직임은 보지 않고, 동전 개수 규칙과 끝내는 조작만 본다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { coinCountOf, CoinShower } from './CoinShower';

vi.mock('next/image', () => ({ default: () => <span /> }));

const PILL = { left: 20, top: 12, width: 96, height: 32 };
const renderShower = (onEnd = vi.fn()) => {
  render(<CoinShower pill={PILL} fromWon={2015} toWon={2347} onEnd={onEnd} />);
  return onEnd;
};
const skip = () => screen.getByRole('button', { name: '건너뛰기 ›' });

afterEach(cleanup);

describe('coinCountOf', () => {
  it.each([
    ['표현 하나', 11, 4],
    ['대화 하나', 111, 6],
    ['하루를 다 채움', 332, 12],
    ['그보다 많아도', 5000, 12],
  ])('%s(%i원)면 %i개가 날아간다', (_, amountWon, coins) => {
    expect(coinCountOf(amountWon)).toBe(coins);
  });
});

describe('CoinShower', () => {
  it('받은 금액을 크게 보여 준다', () => {
    renderShower();

    expect(screen.getByText('+332원')).toBeInTheDocument();
  });

  it('뜨는 순간 건너뛰기에 초점이 간다', () => {
    // given — 키보드와 화면 낭독기로도 바로 끝낼 수 있어야 한다
    renderShower();

    expect(skip()).toHaveFocus();
  });

  it('건너뛰기를 누르면 한 번만 끝낸다', () => {
    const onEnd = renderShower();

    fireEvent.click(skip());

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('화면 아무 데나 눌러도 끝낸다', () => {
    const onEnd = renderShower();

    fireEvent.click(screen.getByText('+332원'));

    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
