// 단어뱅크 순수 로직 검증 — 칩 생성·정답 판정
import { describe, expect, it } from 'vitest';

import { chipsFromWords, isWordsCorrect } from './wordBank';

describe('chipsFromWords', () => {
  it('단어 배열을 순서 그대로 id 붙은 칩으로 만든다 (셔플 안 함)', () => {
    expect(chipsFromWords(['on', 'I', 'got'])).toEqual([
      { id: 0, word: 'on' },
      { id: 1, word: 'I' },
      { id: 2, word: 'got' },
    ]);
  });

  it('중복 단어도 각각 다른 id를 가진다', () => {
    const chips = chipsFromWords(['a', 'a', 'b']);
    expect(chips.map((c) => c.id)).toEqual([0, 1, 2]);
  });
});

describe('isWordsCorrect', () => {
  const answer = ['I', 'got', 'a', 'good', 'deal'];

  it('같은 순서면 정답이다', () => {
    expect(isWordsCorrect(['I', 'got', 'a', 'good', 'deal'], answer)).toBe(
      true,
    );
  });

  it('대소문자가 달라도 정답으로 본다', () => {
    expect(isWordsCorrect(['i', 'GOT', 'a', 'good', 'deal'], answer)).toBe(
      true,
    );
  });

  it('순서가 틀리거나 개수가 다르면 오답이다', () => {
    expect(isWordsCorrect(['got', 'I', 'a', 'good', 'deal'], answer)).toBe(
      false,
    );
    expect(isWordsCorrect(['I', 'got'], answer)).toBe(false);
  });
});
