// 스토어 가격 표기 — 스토어가 준 통화(원·엔)대로 적고, 다룰 수 있는 통화인지 가린다
import { describe, expect, it } from 'vitest';

import { formatPrice, isPricedCurrency } from './store-price';

describe('formatPrice', () => {
  it.each([
    [14_900, 'KRW', '14,900원'],
    [1_500, 'JPY', '1,500円'],
  ] as const)('%s %s는 %s로 적는다', (amount, currency, expected) => {
    expect(formatPrice(amount, currency)).toBe(expected);
  });
});

describe('isPricedCurrency', () => {
  it.each([['KRW'], ['JPY']])('%s는 다룰 수 있는 통화다', (currency) => {
    expect(isPricedCurrency(currency)).toBe(true);
  });

  it.each([['USD'], [''], [undefined]])(
    '%s는 다룰 수 없는 통화다',
    (currency) => {
      expect(isPricedCurrency(currency)).toBe(false);
    },
  );
});
