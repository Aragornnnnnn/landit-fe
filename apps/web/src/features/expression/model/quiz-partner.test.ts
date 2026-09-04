// 퀴즈 상대 무작위 선택 — 난수가 어느 구간이든 목록 안의 한 명으로 떨어지는지 확인한다
import { describe, expect, it } from 'vitest';

import { pickDistinctPartners, pickRandomPartner } from './quiz-partner';

describe('pickRandomPartner', () => {
  it('난수가 0이면 첫 번째 상대(클로이)를 고른다', () => {
    const rand = () => 0;

    const partner = pickRandomPartner(rand);

    expect(partner).toBe('chloe');
  });

  it('난수가 1에 가까우면 마지막 상대(테디)를 고른다', () => {
    const rand = () => 0.999;

    const partner = pickRandomPartner(rand);

    expect(partner).toBe('teddy');
  });

  it('난수가 중간이면 가운데 상대(마르코)를 고른다', () => {
    const rand = () => 0.5;

    const partner = pickRandomPartner(rand);

    expect(partner).toBe('marco');
  });
});

describe('pickDistinctPartners', () => {
  it('요청한 수만큼 서로 다른 상대를 고른다', () => {
    const partners = pickDistinctPartners(2);

    expect(partners).toHaveLength(2);
    expect(partners[0]).not.toBe(partners[1]);
  });

  it('난수가 0이면 목록 순서대로 앞에서부터 고른다', () => {
    const rand = () => 0;

    expect(pickDistinctPartners(2, rand)).toEqual(['chloe', 'marco']);
  });

  it('후보보다 많이 요청해도 후보 수까지만 돌려준다', () => {
    expect(pickDistinctPartners(5)).toHaveLength(3);
  });
});
