// 퀴즈 상대 무작위 선택 — 난수가 어느 구간이든 목록 안의 한 명으로 떨어지는지 확인한다
import { describe, expect, it } from 'vitest';

import { pickRandomPartner } from './quiz-partner';

describe('pickRandomPartner', () => {
  it('난수가 0이면 첫 번째 상대(클로이)를 고른다', () => {
    expect(pickRandomPartner(() => 0)).toBe('chloe');
  });

  it('난수가 1에 가까우면 마지막 상대(테디)를 고른다', () => {
    expect(pickRandomPartner(() => 0.999)).toBe('teddy');
  });

  it('난수가 중간이면 가운데 상대(마르코)를 고른다', () => {
    expect(pickRandomPartner(() => 0.5)).toBe('marco');
  });
});
