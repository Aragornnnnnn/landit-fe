// 마지막으로 본 환급액의 계약 테스트
import { beforeEach, describe, expect, it } from 'vitest';

import {
  balanceGainOf,
  forgetSeenBalance,
  markBalanceSeen,
  readSeenBalance,
} from './seen-balance';

beforeEach(forgetSeenBalance);

describe('readSeenBalance', () => {
  it('본 적이 없으면 모른다', () => {
    expect(readSeenBalance(1)).toBe(null);
  });

  it('적어 둔 금액을 돌려준다', () => {
    markBalanceSeen(1, 2015);

    expect(readSeenBalance(1)).toBe(2015);
  });

  it('다른 계정이 본 금액은 내 것으로 치지 않는다', () => {
    markBalanceSeen(1, 2015);

    expect(readSeenBalance(2)).toBe(null);
  });
});

describe('balanceGainOf', () => {
  it('마지막으로 본 금액보다 늘었으면 그만큼이 방금 받은 것이다', () => {
    expect(balanceGainOf(2015, 2347)).toEqual({ fromWon: 2015, toWon: 2347 });
  });

  it('처음 쌓인 금액도 0원에서 늘어난 것이다', () => {
    expect(balanceGainOf(0, 111)).toEqual({ fromWon: 0, toWon: 111 });
  });

  it('앱을 새로 열어 본 적이 없으면 이미 쌓인 금액을 연출하지 않는다', () => {
    expect(balanceGainOf(null, 2015)).toBe(null);
  });

  it('그대로면 연출하지 않는다', () => {
    expect(balanceGainOf(2015, 2015)).toBe(null);
  });

  it('자정에 초기화돼 줄었으면 연출하지 않는다', () => {
    expect(balanceGainOf(2015, 0)).toBe(null);
  });

  it('쌓인 금액이 없는 사람은 연출하지 않는다', () => {
    expect(balanceGainOf(0, null)).toBe(null);
  });
});
