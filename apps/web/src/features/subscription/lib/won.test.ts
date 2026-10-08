// 원화 표기와 판정 — 금액에 쉼표와 '원'을 붙이고, 서버 금액이 원화인지 가린다
import { describe, expect, it } from 'vitest';

import { formatWon, isWonCurrency } from './won';

describe('formatWon', () => {
  it('천 단위 쉼표와 원을 붙인다', () => {
    expect(formatWon(58_500)).toBe('58,500원');
  });
});

describe('isWonCurrency', () => {
  it('KRW이거나 통화가 비어 있으면 원화로 본다', () => {
    expect(isWonCurrency('KRW')).toBe(true);
    expect(isWonCurrency(null)).toBe(true);
    expect(isWonCurrency(undefined)).toBe(true);
    expect(isWonCurrency('')).toBe(true);
  });

  it('다른 통화는 원화가 아니다', () => {
    expect(isWonCurrency('USD')).toBe(false);
  });
});
