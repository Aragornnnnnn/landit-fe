// 조건 블록의 상태 판정 — 만드는 중이면 스켈레톤, 상한을 넘겼거나 내용이 없으면 숨김, 있으면 그린다
import { describe, expect, it } from 'vitest';

import type { SmallTalkSummaryResponse } from '@/features/small-talk/api/small-talk';

import { toSummaryBlocks } from './summary-blocks';

const growth: SmallTalkSummaryResponse['growth'] = {
  pattern: 'PAST_TENSE',
  patternLabel: '과거형',
  succeeded: true,
  previousDate: '2026-09-10',
  previousSentence: 'I go to gym with my friend.',
  previousWrongSpan: 'go',
  currentSentence: 'I went to the gym with my friend.',
  currentSpan: 'went',
  previousCount: 2,
  currentCount: 0,
};

const item = {
  expressionId: 101,
  text: 'grab a coffee',
  meaning: '커피 한잔 하다',
  sourceLabel: '9월 10일 「주말 계획」',
  messageId: 55021,
  quotedSentence: 'Wanna grab a coffee this weekend?',
  matchedText: 'grab a coffee',
};

const summaryOf = (
  overrides: Partial<SmallTalkSummaryResponse>,
): SmallTalkSummaryResponse => ({
  sessionId: 7,
  title: '카페 얘기',
  firstSession: false,
  headline: { text: 'a', subline: 'b', pose: 'POINT' },
  comparison: {
    previousSessionId: 6,
    previousDate: '2026-09-10',
    current: { speakingMs: 1, turnCount: 1, maxWordsInTurn: 1 },
    previous: { speakingMs: 1, turnCount: 1, maxWordsInTurn: 1 },
  },
  growth: null,
  reusedExpressions: { pending: false, items: [] },
  followUp: {
    pending: false,
    triggerType: 'NONE',
    question: '다음엔 요즘 빠져 있는 거 얘기해줘.',
    invite: '기억해둘게.',
  },
  correctionCount: 0,
  ...overrides,
});

describe('toSummaryBlocks — 실수 기억 카드', () => {
  it('없으면 숨긴다', () => {
    expect(toSummaryBlocks(summaryOf({}), false).growth).toEqual({
      kind: 'hidden',
    });
  });

  it('있으면 그린다', () => {
    expect(toSummaryBlocks(summaryOf({ growth }), false).growth).toEqual({
      kind: 'ready',
      data: growth,
    });
  });
});

describe('toSummaryBlocks — 배운 표현 재사용', () => {
  it('아직 만드는 중이면 스켈레톤이다', () => {
    const summary = summaryOf({
      reusedExpressions: { pending: true, items: [] },
    });

    expect(toSummaryBlocks(summary, false).reusedExpressions).toEqual({
      kind: 'loading',
    });
  });

  it('상한까지 기다렸는데도 안 왔으면 숨긴다', () => {
    const summary = summaryOf({
      reusedExpressions: { pending: true, items: [] },
    });

    expect(toSummaryBlocks(summary, true).reusedExpressions).toEqual({
      kind: 'hidden',
    });
  });

  it('준비됐는데 쓴 표현이 없으면 숨긴다', () => {
    expect(toSummaryBlocks(summaryOf({}), false).reusedExpressions).toEqual({
      kind: 'hidden',
    });
  });

  it('쓴 표현이 있으면 그린다', () => {
    const summary = summaryOf({
      reusedExpressions: { pending: false, items: [item] },
    });

    expect(toSummaryBlocks(summary, false).reusedExpressions).toEqual({
      kind: 'ready',
      data: [item],
    });
  });
});

describe('toSummaryBlocks — 상한이 지나도', () => {
  it('이미 온 블록은 그리고 아직인 블록만 숨긴다', () => {
    const summary = summaryOf({
      reusedExpressions: { pending: false, items: [item] },
      followUp: {
        pending: true,
        triggerType: 'NONE',
        question: '',
        invite: '',
      },
    });

    const blocks = toSummaryBlocks(summary, true);

    expect(blocks.reusedExpressions).toEqual({ kind: 'ready', data: [item] });
    expect(blocks.followUp).toEqual({ kind: 'hidden' });
  });
});

describe('toSummaryBlocks — 다음 스몰톡에서', () => {
  it('아직 만드는 중이면 스켈레톤이다', () => {
    const summary = summaryOf({
      followUp: {
        pending: true,
        triggerType: 'NONE',
        question: '',
        invite: '',
      },
    });

    expect(toSummaryBlocks(summary, false).followUp).toEqual({
      kind: 'loading',
    });
  });

  it('상한까지 기다렸는데도 안 왔으면 숨긴다', () => {
    const summary = summaryOf({
      followUp: {
        pending: true,
        triggerType: 'NONE',
        question: '',
        invite: '',
      },
    });

    expect(toSummaryBlocks(summary, true).followUp).toEqual({ kind: 'hidden' });
  });

  it('기억이 없어(NONE) 기본 문구여도 그린다', () => {
    const summary = summaryOf({});

    expect(toSummaryBlocks(summary, false).followUp).toEqual({
      kind: 'ready',
      data: summary.followUp,
    });
  });
});
