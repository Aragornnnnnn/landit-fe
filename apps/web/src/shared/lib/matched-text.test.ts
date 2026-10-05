// 강조 구절 자르기 — 낱말로 선 자리를 먼저 고르고, 못 찾으면 나누지 않는다
import { describe, expect, it } from 'vitest';

import { splitMatchedText } from './matched-text';

describe('splitMatchedText', () => {
  it('원문 안의 구절을 앞·구절·뒤로 나눈다', () => {
    const split = splitMatchedText("I'm working out now.", 'working out');

    expect(split).toEqual({
      before: "I'm ",
      match: 'working out',
      after: ' now.',
    });
  });

  it('원문에 그 구절이 없으면 나누지 않는다', () => {
    expect(splitMatchedText("I'm working out now.", 'work out')).toBeNull();
  });

  it.each([
    ['없으면', undefined],
    ['비어 있으면', ''],
  ])('강조할 구절이 %s 나누지 않는다', (_, matchedText) => {
    expect(splitMatchedText("I'm working out now.", matchedText)).toBeNull();
  });

  it('낱말 안에 파묻힌 자리 대신 낱말로 선 자리를 고른다', () => {
    // 실수 기억 카드의 강조 구절은 "go" 같은 낱말 하나라 "got" 안쪽에 걸리기 쉽다
    const split = splitMatchedText('I got up and go to the gym.', 'go');

    expect(split).toEqual({
      before: 'I got up and ',
      match: 'go',
      after: ' to the gym.',
    });
  });

  it('낱말로 선 자리가 없으면 파묻힌 자리라도 고른다', () => {
    // 서버가 낱말 조각을 줄 수도 있다 — 못 찾는 것보다 낫다
    expect(splitMatchedText('I got up.', 'go')).toEqual({
      before: 'I ',
      match: 'go',
      after: 't up.',
    });
  });
});
