import { describe, expect, it } from 'vitest';

import type { SmallTalkSessionExpression } from '../api/small-talk';
import {
  isFreeTrialExpression,
  toExpressionListItems,
} from './session-expressions';

const expressionOf = (
  expressionId: number,
  completed: boolean,
): SmallTalkSessionExpression => ({
  expressionId,
  displayOrder: expressionId,
  targetExpressionText: 'grab a coffee',
  baseExpressionMeaningText: '커피 한잔 하다',
  completed,
  lastRecommendedAt: null,
});

describe('toExpressionListItems', () => {
  it('아직 안 배운 것 중 첫 표현만 열어 준다', () => {
    const items = toExpressionListItems([
      expressionOf(1, true),
      expressionOf(2, false),
      expressionOf(3, false),
    ]);

    expect(items.map((item) => item.locked)).toEqual([false, false, true]);
  });

  it('다 배웠으면 잠긴 것이 없다 — 전부 다시 볼 수 있다', () => {
    const items = toExpressionListItems([
      expressionOf(1, true),
      expressionOf(2, true),
    ]);

    expect(items.every((item) => !item.locked)).toBe(true);
  });
});

describe('isFreeTrialExpression', () => {
  it('서버가 무료 대화로 열어 준 표현이면 참이다', () => {
    // Given 무료 스몰톡에서 나온 표현
    const expressions = [{ ...expressionOf(1, false), freeTrial: true }];

    // When 그 표현을 물으면 / Then 페이월 없이 열 수 있다
    expect(isFreeTrialExpression(expressions, 1)).toBe(true);
  });

  it('무료 표시가 없거나 목록에 없는 표현이면 거짓이다', () => {
    const expressions = [
      { ...expressionOf(1, false), freeTrial: false },
      expressionOf(2, false),
    ];

    expect(isFreeTrialExpression(expressions, 1)).toBe(false);
    expect(isFreeTrialExpression(expressions, 2)).toBe(false);
    expect(isFreeTrialExpression(expressions, 3)).toBe(false);
  });
});
