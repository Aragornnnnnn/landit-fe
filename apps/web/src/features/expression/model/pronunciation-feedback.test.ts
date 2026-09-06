// 발음 분석 응답 → 피드백 화면 모델 변환 검증 — 오류 카드 분기와 respelling 하이라이트 분해
import { describe, expect, it } from 'vitest';

import type { PronunciationWord } from '../api/pronunciation';
import { splitDisplay, toFeedbackCards } from './pronunciation-feedback';

const word = (overrides: Partial<PronunciationWord>): PronunciationWord => ({
  order: 1,
  word: 'nothing',
  status: 'CORRECT',
  startTimeMs: null,
  endTimeMs: null,
  nativeWordAudioUrl: null,
  nativeDisplay: null,
  userDisplay: null,
  errorTargetSpan: null,
  errorUserSpan: null,
  syllables: null,
  stressIndex: null,
  userStressIndex: null,
  coachingText: null,
  ...overrides,
});

describe('splitDisplay', () => {
  it('span이 표기 안에 있으면 앞·오류·뒤 세그먼트로 나눈다', () => {
    expect(splitDisplay('nuh·ssing', 'ss')).toEqual([
      { text: 'nuh·', error: false },
      { text: 'ss', error: true },
      { text: 'ing', error: false },
    ]);
  });

  it('span이 표기 맨 앞이면 빈 세그먼트 없이 오류부터 시작한다', () => {
    expect(splitDisplay('thing', 'th')).toEqual([
      { text: 'th', error: true },
      { text: 'ing', error: false },
    ]);
  });

  it('span이 없으면 통짜 일반 세그먼트로 둔다', () => {
    expect(splitDisplay('nuh·thing', null)).toEqual([
      { text: 'nuh·thing', error: false },
    ]);
  });

  it('span을 표기에서 못 찾으면 통짜 일반 세그먼트로 둔다', () => {
    expect(splitDisplay('nuh·thing', 'zz')).toEqual([
      { text: 'nuh·thing', error: false },
    ]);
  });

  it('표기가 없으면 빈 배열이다', () => {
    expect(splitDisplay(null, 'ss')).toEqual([]);
  });
});

describe('toFeedbackCards', () => {
  it('정상 단어는 카드에서 빠지고 오류 단어만 order 순으로 남는다', () => {
    const words = [
      word({
        order: 3,
        word: 'clear',
        status: 'PHONEME_ERROR',
        nativeDisplay: 'kleer',
        userDisplay: 'keuh·leer',
      }),
      word({ order: 1, status: 'CORRECT' }),
      word({
        order: 2,
        word: 'hiking',
        status: 'STRESS_ERROR',
        syllables: ['hik', 'ing'],
        stressIndex: 0,
        userStressIndex: 1,
      }),
    ];

    const cards = toFeedbackCards(words);

    expect(cards.map((card) => card.word.order)).toEqual([2, 3]);
  });

  it('음소 오류는 native·user respelling을 하이라이트 세그먼트로 분해한 카드가 된다', () => {
    const cards = toFeedbackCards([
      word({
        status: 'PHONEME_ERROR',
        nativeDisplay: 'nuh·thing',
        userDisplay: 'nuh·ssing',
        errorTargetSpan: 'th',
        errorUserSpan: 'ss',
      }),
    ]);

    expect(cards).toEqual([
      {
        kind: 'phoneme',
        word: expect.objectContaining({ status: 'PHONEME_ERROR' }),
        native: [
          { text: 'nuh·', error: false },
          { text: 'th', error: true },
          { text: 'ing', error: false },
        ],
        user: [
          { text: 'nuh·', error: false },
          { text: 'ss', error: true },
          { text: 'ing', error: false },
        ],
      },
    ]);
  });

  it('강세 오류는 음절 배열과 강세 위치를 든 카드가 된다', () => {
    const cards = toFeedbackCards([
      word({
        status: 'STRESS_ERROR',
        syllables: ['hik', 'ing'],
        stressIndex: 0,
        userStressIndex: 1,
      }),
    ]);

    expect(cards).toEqual([
      {
        kind: 'stress',
        word: expect.objectContaining({ status: 'STRESS_ERROR' }),
        syllables: ['hik', 'ing'],
        stressIndex: 0,
        userStressIndex: 1,
      },
    ]);
  });

  it('강세 오류인데 음절 데이터가 없으면 카드를 만들지 않는다 — 그릴 재료가 없다', () => {
    const cards = toFeedbackCards([
      word({ status: 'STRESS_ERROR', syllables: null }),
    ]);

    expect(cards).toEqual([]);
  });
});
