// 발음 점수 표시 규칙 검증 — BE passed 기준 통과와 구간별 문구
import { describe, expect, it } from 'vitest';

import type { PronunciationWord } from '../api/pronunciation';
import { isLowScoreWord, scoreView, wordTone } from './pronunciation-score';

const lowWord = (score: number) =>
  ({ score, status: 'CORRECT' }) as PronunciationWord;

describe('scoreView', () => {
  it('100점으로 통과하면 Perfect로 보여준다', () => {
    expect(scoreView({ score: 100, passed: true, words: [] })).toEqual({
      display: 100,
      label: 'Perfect!',
      tone: 'green',
      perfect: true,
    });
  });

  it('95~99점으로 통과하면 실제 점수를 Excellent로 보여준다', () => {
    expect(
      scoreView({ score: 97, passed: true, words: [lowWord(80)] }),
    ).toEqual({
      display: 97,
      label: 'Excellent!',
      tone: 'green',
      perfect: false,
    });
  });

  it('통과했어도 50점 이하 단어가 있으면 Excellent로 보여주지 않는다', () => {
    expect(
      scoreView({ score: 96, passed: true, words: [lowWord(50)] }),
    ).toEqual({
      display: 96,
      label: 'Great!',
      tone: 'green',
      perfect: false,
    });
  });

  it('BE가 통과가 아니면 점수가 높아도 통과로 바꾸지 않는다 — 판정은 서버가 단일 출처', () => {
    expect(scoreView({ score: 99, passed: false, words: [] })).toEqual({
      display: 99,
      label: 'Great!',
      tone: 'green',
      perfect: false,
    });
  });

  it.each([
    [92, 'Great!', 'green'],
    [71, 'Great!', 'green'],
    [70, 'Good!', 'yellow'],
    [41, 'Good!', 'yellow'],
    [40, 'Keep going!', 'red'],
    [0, 'Keep going!', 'red'],
  ])('%i점이면 %s(%s) 구간이고 점수 그대로 보여준다', (score, label, tone) => {
    expect(scoreView({ score, passed: false, words: [] })).toEqual({
      display: score,
      label,
      tone,
      perfect: false,
    });
  });
});

describe('wordTone', () => {
  const tone = (status: PronunciationWord['status'], score?: number | null) =>
    wordTone({ status, score } as PronunciationWord);

  it.each([
    [100, 'green'],
    [81, 'green'],
    [80, 'yellow'],
    [51, 'yellow'],
    [50, 'red'],
    [40, 'red'],
  ])('맞음 판정에 단어 점수가 %i점이면 %s다', (score, expected) => {
    expect(tone('CORRECT', score)).toBe(expected);
  });

  it('점수가 없는 맞음 단어는 초록이다', () => {
    expect(tone('CORRECT', null)).toBe('green');
  });

  it('점수가 없는 오류 단어는 빨강이다', () => {
    expect(tone('PHONEME_ERROR')).toBe('red');
  });

  it('오류 단어는 점수가 높게 와도 초록으로 보여주지 않는다', () => {
    expect(tone('STRESS_ERROR', 100)).toBe('red');
  });

  it('오류 단어도 51~80점이면 노랑이다', () => {
    expect(tone('PHONEME_ERROR', 80)).toBe('yellow');
  });
});

describe('isLowScoreWord', () => {
  it.each([
    [99, true],
    [100, false],
    [null, false],
    [undefined, false],
  ])('단어 점수가 %s면 %s다', (score, expected) => {
    expect(isLowScoreWord({ score } as PronunciationWord)).toBe(expected);
  });
});
