import { describe, expect, it } from 'vitest';

import type { SmallTalkSessionExpression } from '../api/small-talk';
import { toExpressionListItems } from './session-expressions';

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
