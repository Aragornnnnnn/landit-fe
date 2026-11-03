// 시나리오 카드 바탕 — 많이 쌓여도 구분되게 시나리오마다 색이 다르되, 같은 시나리오는 늘 같은 색이다
import { describe, expect, it } from 'vitest';

import { SCENARIO_TINTS, toScenarioTint } from './partner-tint';

describe('toScenarioTint', () => {
  it('같은 시나리오는 언제 그려도 같은 색이다', () => {
    expect(toScenarioTint(7)).toBe(toScenarioTint(7));
  });

  it('연달아 만든 시나리오는 색이 서로 다르다', () => {
    const tints = Array.from({ length: SCENARIO_TINTS.length }, (_, index) =>
      toScenarioTint(index + 1),
    );

    expect(new Set(tints).size).toBe(SCENARIO_TINTS.length);
  });

  it('가짓수를 넘는 id도 목록 안의 색을 고른다', () => {
    expect(SCENARIO_TINTS).toContain(toScenarioTint(10_000));
  });
});
