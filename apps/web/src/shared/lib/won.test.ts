// 원 단위 금액 표기 테스트
import { describe, expect, it } from 'vitest';

import { formatWon, formatWonShort } from './won';

describe('formatWon', () => {
  it('세 자리마다 쉼표를 찍고 원을 붙인다', () => {
    expect(formatWon(10000)).toBe('10,000원');
  });
});

describe('formatWonShort', () => {
  it('만 원 단위로 떨어지면 만원으로 줄인다', () => {
    expect(formatWonShort(10000)).toBe('1만원');
    expect(formatWonShort(30000)).toBe('3만원');
  });

  it('만 원 단위가 아니면 그대로 적는다', () => {
    expect(formatWonShort(15500)).toBe('15,500원');
    expect(formatWonShort(3000)).toBe('3,000원');
  });
});
