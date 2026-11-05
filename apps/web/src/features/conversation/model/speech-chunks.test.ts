// 발화를 합성 단위로 나누는 규칙 검증 — 소리를 빨리 시작하면서 문장 중간을 끊지 않아야 한다
import { describe, expect, it } from 'vitest';

import { splitSpeechChunks } from './speech-chunks';

describe('splitSpeechChunks', () => {
  it('충분히 긴 문장들은 문장 끝마다 나눈다', () => {
    // Given
    const text =
      'That sounds like a really fun trip, honestly. I have always wanted to go there myself. What was the best thing you ate?';

    // When
    const chunks = splitSpeechChunks(text);

    // Then
    expect(chunks).toEqual([
      'That sounds like a really fun trip, honestly.',
      'I have always wanted to go there myself.',
      'What was the best thing you ate?',
    ]);
  });

  it('나눈 조각을 이으면 원문과 같다 — 말이 빠지거나 바뀌면 안 된다', () => {
    // Given
    const text =
      'Oh nice! That sounds like a really fun trip, honestly. Would you go back again?';

    // When
    const chunks = splitSpeechChunks(text);

    // Then
    expect(chunks.join(' ')).toBe(text);
  });

  it('짧은 첫 문장은 다음 문장과 붙인다 — 혼자 먼저 끝나면 다음 조각을 기다리며 끊긴다', () => {
    // Given
    const text = 'Oh nice! That sounds like a really fun trip, honestly.';

    // When
    const chunks = splitSpeechChunks(text);

    // Then
    expect(chunks).toEqual([text]);
  });

  it('짧은 마지막 문장은 앞 조각에 붙인다', () => {
    // Given
    const text = 'I have always wanted to go there myself, honestly. Really?';

    // When
    const chunks = splitSpeechChunks(text);

    // Then
    expect(chunks).toEqual([text]);
  });

  it('약어와 소수점에서는 나누지 않는다', () => {
    // Given
    const text =
      'Mr. Kim said the meeting moved to 3.5 hours later than planned. Do you want to grab a coffee first?';

    // When
    const chunks = splitSpeechChunks(text);

    // Then
    expect(chunks).toEqual([
      'Mr. Kim said the meeting moved to 3.5 hours later than planned.',
      'Do you want to grab a coffee first?',
    ]);
  });

  it('문장 부호가 없으면 통째로 한 조각이다', () => {
    // Given
    const text = 'so what was the best thing you ate while you were there';

    // When
    const chunks = splitSpeechChunks(text);

    // Then
    expect(chunks).toEqual([text]);
  });

  it('따옴표로 끝나는 문장도 문장 끝으로 본다', () => {
    // Given
    const text =
      'She looked at me and said "that is not what I ordered." I honestly did not know what to say.';

    // When
    const chunks = splitSpeechChunks(text);

    // Then
    expect(chunks).toEqual([
      'She looked at me and said "that is not what I ordered."',
      'I honestly did not know what to say.',
    ]);
  });

  it.each([
    [
      '호칭',
      'I talked to my friend about it and Mr. Kim said that the meeting was moved to later today.',
    ],
    [
      '소문자가 이어지는 시각',
      "Let's meet in front of the main library at 9 a.m. on Friday so we can walk to class together.",
    ],
    [
      '소문자가 이어지는 약어',
      'My roommate just got back from the U.S. and she brought a whole suitcase full of snacks.',
    ],
    [
      '대문자가 이어지는 약어',
      'My roommate just got back from the U.S. Embassy and she brought a whole suitcase of forms.',
    ],
    [
      '숫자 앞 약어',
      'I am staying in the dorm room No. 5 this year and it is really close to the library.',
    ],
    [
      '문장 앞쪽 호칭',
      'I usually study with my lab partner, Dr. Lee, and it really helps me a lot before the exams.',
    ],
  ])(
    '%s에서는 문장을 끊지 않는다 — 중간에 내림 억양과 쉼이 들어가면 안 된다',
    (_, text) => {
      // When
      const chunks = splitSpeechChunks(text);

      // Then
      expect(chunks).toEqual([text]);
    },
  );
});
