// 동전 연출 검증 — 그림과 움직임은 보지 않고, 동전 개수 규칙과 끝내는 조작만 본다
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { coinCountOf, CoinShower } from './CoinShower';

vi.mock('next/image', () => ({ default: () => <span /> }));
const analytics = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: analytics.track }));
const stopRhythm = vi.hoisted(() => vi.fn());
const rhythmMock = vi.hoisted(() => vi.fn(() => stopRhythm));
vi.mock('@/shared/haptics', () => ({
  hapticRhythm: rhythmMock,
}));

const PILL = { left: 20, top: 12, width: 96, height: 32 };
const renderShower = (onEnd = vi.fn()) => {
  render(<CoinShower pill={PILL} fromWon={2015} toWon={2347} onEnd={onEnd} />);
  return onEnd;
};
const skip = () => screen.getByRole('button', { name: '건너뛰기 ›' });

afterEach(() => {
  cleanup();
  rhythmMock.mockClear();
  stopRhythm.mockClear();
  vi.useRealTimers();
});

describe('coinCountOf', () => {
  it.each([
    ['아주 적은 금액', 11, 4],
    ['조금 큰 금액', 111, 6],
    ['하루 몫', 500, 12],
    ['그보다 많아도', 5000, 12],
  ])('%s(%i원)면 %i개가 날아간다', (_, amountWon, coins) => {
    expect(coinCountOf(amountWon)).toBe(coins);
  });
});

describe('CoinShower', () => {
  it('동전 리듬은 알약에 닿는 순간 끝나고, 숫자 리듬은 그 뒤에 시작한다', () => {
    renderShower();

    const calls = rhythmMock.mock.calls as unknown as [
      string,
      { startAt?: number; endAt?: number },
    ][];
    expect(calls.map(([name]) => name)).toEqual(['coins', 'countUp']);
    const [[, coins], [, countUp]] = calls;
    expect(countUp.startAt).toBeGreaterThan(coins.endAt ?? Infinity);
  });

  it('건너뛰어 닫히면 남은 박자를 멈춘다', () => {
    renderShower();

    fireEvent.click(skip());
    cleanup();

    expect(stopRhythm).toHaveBeenCalledTimes(2);
  });

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

describe('CoinShower 계측', () => {
  it('뜨는 순간 받은 금액과 함께 노출을 한 번 찍는다', () => {
    renderShower();

    expect(analytics.track.mock.calls).toEqual([
      ['Reward Coin Shower Viewed', { gain_won: 332 }],
    ]);
  });

  it('다 돌기 전에 누르면 건너뛰기를 찍는다', () => {
    renderShower();

    fireEvent.click(skip());

    expect(analytics.track).toHaveBeenCalledWith('Reward Coin Shower Skipped', {
      gain_won: 332,
    });
  });

  it('끝까지 다 돌아 끝나면 건너뛰기를 찍지 않는다', () => {
    vi.useFakeTimers();
    const onEnd = renderShower();

    vi.runAllTimers();

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(analytics.track).not.toHaveBeenCalledWith(
      'Reward Coin Shower Skipped',
      expect.anything(),
    );
  });
});
