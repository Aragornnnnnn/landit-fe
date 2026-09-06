// 복습 문제 큐 검증 — 맞히면 빠지고, 틀리면 맨 뒤로 가서 맞출 때까지 다시 나온다
import { describe, expect, it } from 'vitest';

import { settleReviewQueue } from './review-queue';

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
