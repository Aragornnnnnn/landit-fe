// 이용권 정가·할인율 — 정가는 결제가의 두 배, 할인율은 그 차이
import { describe, expect, it } from 'vitest';

import { discountPercentOf, listPriceOf } from './pass-price';

describe('listPriceOf', () => {
  it('정가는 결제가의 두 배다 — 가격 실험으로 결제가가 바뀌어도 반값이 유지된다', () => {
    expect(listPriceOf(50_000)).toBe(100_000);
    expect(listPriceOf(39_900)).toBe(79_800);
  });
});

describe('discountPercentOf', () => {
  it('정가 대비 깎인 비율을 정수 퍼센트로 준다', () => {
    expect(discountPercentOf(50_000, 100_000)).toBe(50);
  });

  it('나누어떨어지지 않으면 내림한다 — 실제보다 크게 깎아 준다고 말하지 않는다', () => {
    expect(discountPercentOf(66_700, 100_000)).toBe(33);
  });
});
