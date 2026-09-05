// 답변 모양 검사 — 약속한 모양만 통과하고 크기 상한을 넘으면 거른다
import { describe, expect, it } from 'vitest';

import { isAnswers } from './answer-shape';

describe('isAnswers', () => {
  it('문자열·숫자·문자열 배열로 된 답변은 통과한다', () => {
    expect(isAnswers({ a: '지인 추천', b: 4, c: ['x', 'y'] })).toBe(true);
  });

  it.each([
    ['객체가 아니면', ['x']],
    ['값이 중첩 객체면', { q: { nested: true } }],
    ['배열 안에 문자열이 아닌 게 있으면', { q: [1, 2] }],
    ['글이 너무 길면', { q: 'a'.repeat(1001) }],
    ['배열 원소가 너무 많으면', { q: Array.from({ length: 21 }, () => 'x') }],
    [
      '키가 너무 많으면',
      Object.fromEntries(Array.from({ length: 41 }, (_, i) => [`k${i}`, 'x'])),
    ],
    ['숫자가 유한하지 않으면', { q: Number.POSITIVE_INFINITY }],
  ])('%s 거른다', (_, value) => {
    expect(isAnswers(value)).toBe(false);
  });
});
