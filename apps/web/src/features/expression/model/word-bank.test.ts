// 단어뱅크 순수 로직 검증 — 칩 생성·정답 판정
import { describe, expect, it } from 'vitest';

import {
  bestMatchingAnswer,
  chipsFromWords,
  isWordsCorrect,
  matchesAnyAnswer,
  maxAnswerLength,
} from './word-bank';

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

describe('복수 정답', () => {
  // 한국어 작문은 어순이 달라도 같은 뜻이면 서버가 정답으로 본다 — 화면도 같은 기준을 써야 한다
  const answers = [
    ['나도', '완전', '콜이야'],
    ['완전', '콜이야', '나도'],
  ];

  it('허용 정답 중 하나와 맞으면 정답이다', () => {
    expect(matchesAnyAnswer(['완전', '콜이야', '나도'], answers)).toBe(true);
  });

  it('어느 정답과도 다르면 오답이다', () => {
    expect(matchesAnyAnswer(['콜이야', '완전', '나도'], answers)).toBe(false);
  });

  it('지금 배치와 앞에서부터 가장 많이 맞는 정답을 힌트 기준으로 고른다', () => {
    expect(bestMatchingAnswer(['완전'], answers)).toEqual(answers[1]);
  });

  it('아무것도 안 골랐으면 첫 번째 정답을 기준으로 삼는다', () => {
    expect(bestMatchingAnswer([], answers)).toEqual(answers[0]);
  });

  it('맞는 자리 수가 같으면 앞선 정답을 유지한다 — 기준이 매번 흔들리지 않게', () => {
    expect(bestMatchingAnswer(['틀린말'], answers)).toEqual(answers[0]);
  });

  it('가장 긴 정답까지 단어를 올릴 수 있다', () => {
    expect(maxAnswerLength([['a'], ['a', 'b', 'c']])).toBe(3);
  });
});
