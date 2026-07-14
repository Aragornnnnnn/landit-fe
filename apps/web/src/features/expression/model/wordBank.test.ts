// 단어뱅크 순수 로직 검증 — 토큰화·칩 생성·정답 판정·단어수
import { describe, expect, it } from 'vitest';

import {
  buildWordChips,
  chipsFromWords,
  countWords,
  isArrangementCorrect,
  isWordsCorrect,
  tokenize,
} from './wordBank';

describe('tokenize', () => {
  it('공백으로 단어를 나누고 양끝 문장부호를 뗀다', () => {
    expect(tokenize('The special effects blew my mind.')).toEqual([
      'The',
      'special',
      'effects',
      'blew',
      'my',
      'mind',
    ]);
  });

  it('내부 아포스트로피는 보존한다', () => {
    expect(tokenize("It's a good deal")).toEqual(["It's", 'a', 'good', 'deal']);
  });

  it('따옴표로 감싼 단어는 부호만 벗긴다', () => {
    expect(tokenize('say "hello" now')).toEqual(['say', 'hello', 'now']);
  });
});

describe('buildWordChips', () => {
  it('기본 셔플(항등)이면 문장 순서대로 id가 붙은 칩을 만든다', () => {
    expect(buildWordChips('I got it')).toEqual([
      { id: 0, word: 'I' },
      { id: 1, word: 'got' },
      { id: 2, word: 'it' },
    ]);
  });

  it('주입한 셔플 함수로 순서를 바꾼다', () => {
    const reverse = <T>(items: T[]) => [...items].reverse();
    expect(buildWordChips('a b c', reverse).map((chip) => chip.word)).toEqual([
      'c',
      'b',
      'a',
    ]);
  });
});

describe('isArrangementCorrect', () => {
  const answer = 'I got a good deal on this jacket';

  it('같은 순서면 정답이다', () => {
    expect(
      isArrangementCorrect(
        ['I', 'got', 'a', 'good', 'deal', 'on', 'this', 'jacket'],
        answer,
      ),
    ).toBe(true);
  });

  it('대소문자·문장부호가 달라도 정답으로 본다', () => {
    expect(
      isArrangementCorrect(
        ['i', 'GOT', 'a', 'good', 'deal', 'on', 'this', 'jacket'],
        'I got a good deal on this jacket.',
      ),
    ).toBe(true);
  });

  it('순서가 틀리면 오답이다', () => {
    expect(
      isArrangementCorrect(
        ['got', 'I', 'a', 'good', 'deal', 'on', 'this', 'jacket'],
        answer,
      ),
    ).toBe(false);
  });

  it('개수가 모자라면 오답이다', () => {
    expect(isArrangementCorrect(['I', 'got'], answer)).toBe(false);
  });
});

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

describe('countWords', () => {
  it('입력 문장의 단어 수를 센다', () => {
    expect(countWords('I got a good deal on these shoes')).toBe(8);
  });

  it('빈 문자열은 0이다', () => {
    expect(countWords('   ')).toBe(0);
  });
});
