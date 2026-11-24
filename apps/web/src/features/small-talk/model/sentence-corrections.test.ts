// 문장별 교정을 말풍선 묶음과 칠할 조각으로 나누는 규칙 테스트
import { describe, expect, it } from 'vitest';

import type { TranscriptSentence } from '../api/small-talk';
import {
  groupSentences,
  hasSentenceCorrection,
  splitByRanges,
} from './sentence-corrections';

const plain = (text: string): TranscriptSentence => ({
  text,
  strikes: [],
  correction: null,
});

const corrected = (text: string, fixed: string): TranscriptSentence => ({
  text,
  strikes: [{ start: 0, end: 1 }],
  correction: { fixed, changes: [], tip: '팁', memory: null },
});

describe('groupSentences', () => {
  it('고칠 게 없는 문장이 이어지면 한 덩어리로 이어 붙인다', () => {
    const blocks = groupSentences([plain('Hi.'), plain('How are you?')]);

    expect(blocks).toEqual([{ kind: 'plain', text: 'Hi. How are you?' }]);
  });

  it('고친 문장은 따로 서고 앞뒤의 고칠 게 없는 문장은 각자 묶인다', () => {
    const fix = corrected('I go to the gym.', 'I went to the gym.');

    const blocks = groupSentences([
      plain('Hi.'),
      fix,
      plain('It was fun.'),
      plain('Really.'),
    ]);

    expect(blocks).toEqual([
      { kind: 'plain', text: 'Hi.' },
      { kind: 'corrected', sentence: fix },
      { kind: 'plain', text: 'It was fun. Really.' },
    ]);
  });

  it('고친 문장이 연달아 오면 하나씩 따로 선다', () => {
    const first = corrected('I go.', 'I went.');
    const second = corrected('It tired.', 'It was tiring.');

    const blocks = groupSentences([first, second]);

    expect(blocks).toEqual([
      { kind: 'corrected', sentence: first },
      { kind: 'corrected', sentence: second },
    ]);
  });
});

describe('splitByRanges', () => {
  it('범위 안과 밖을 순서대로 나눈다', () => {
    const parts = splitByRanges('I did stairs for very long time.', [
      { start: 0, end: 1 },
      { start: 17, end: 21 },
    ]);

    expect(parts).toEqual([
      { text: 'I', marked: true },
      { text: ' did stairs for ', marked: false },
      { text: 'very', marked: true },
      { text: ' long time.', marked: false },
    ]);
  });

  it('범위가 없으면 문장 전체가 칠하지 않은 한 조각이다', () => {
    expect(splitByRanges('It was fun.', [])).toEqual([
      { text: 'It was fun.', marked: false },
    ]);
  });
});

describe('hasSentenceCorrection', () => {
  it('고친 문장이 하나라도 있으면 true다', () => {
    expect(
      hasSentenceCorrection([plain('Hi.'), corrected('I go.', 'I went.')]),
    ).toBe(true);
  });

  it('모든 문장에 교정이 없으면 false다', () => {
    expect(hasSentenceCorrection([plain('Hi.')])).toBe(false);
  });
});
