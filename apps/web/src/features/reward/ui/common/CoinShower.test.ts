// 동전 연출의 동전 개수 규칙 — 받은 금액이 클수록 많이 날아간다
import { describe, expect, it } from 'vitest';

import { coinCountOf } from './CoinShower';

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
