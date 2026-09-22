// 복습 문제 큐 검증 — 맞히면 빠지고, 틀리면 맨 뒤로 가서 맞출 때까지 다시 나온다
import { describe, expect, it } from 'vitest';

import { retryGuideOf, settleReviewQueue } from './review-queue';

describe('settleReviewQueue', () => {
  it('맞히면 지금 문제가 큐에서 빠진다', () => {
    expect(settleReviewQueue([0, 1], 'correct')).toEqual([1]);
  });

  it('틀리면 지금 문제가 맨 뒤로 가서 다른 문제 뒤에 다시 나온다', () => {
    expect(settleReviewQueue([0, 1], 'wrong')).toEqual([1, 0]);
  });

  it('남은 문제가 하나뿐일 때 틀리면 그 문제가 곧바로 다시 나온다', () => {
    expect(settleReviewQueue([1], 'wrong')).toEqual([1]);
  });
});

describe('retryGuideOf', () => {
  it('아직 안 틀렸으면 재도전 지시문 없이 기본 문구를 쓴다', () => {
    expect(retryGuideOf(0)).toEqual({
      revealAnswer: false,
      instruction: undefined,
    });
  });

  it('한 번 틀리면 정답을 감춘 채 다시 풀게 한다', () => {
    expect(retryGuideOf(1)).toEqual({
      revealAnswer: false,
      instruction: '다시 한번 해보세요',
    });
  });

  it('두 번 틀리면 정답을 보여주고 그대로 만들게 한다', () => {
    expect(retryGuideOf(2)).toEqual({
      revealAnswer: true,
      instruction: '정답을 보고 그대로 만들어보세요',
    });
  });
});
