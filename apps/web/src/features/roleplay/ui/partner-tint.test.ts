// 시나리오 카드 바탕 — 많이 쌓여도 구분되게 시나리오마다 색이 다르되, 같은 시나리오는 늘 같은 색이다
import { describe, expect, it } from 'vitest';

import { SCENARIO_TINTS, toScenarioTint } from './partner-tint';

describe('toScenarioTint', () => {
  it('바탕색은 서로 다른 60가지다', () => {
    expect(SCENARIO_TINTS).toHaveLength(60);
    expect(new Set(SCENARIO_TINTS).size).toBe(60);
  });

  it('이미 정해진 색은 코드가 바뀌어도 그대로다', () => {
    // Then 값이 달라지면 사용자의 카드 색이 바뀐다 — 이 값은 고치지 않는다
    expect(toScenarioTint(1)).toBe(
      'radial-gradient(circle at 50% 38%, hsl(126 50% 91%), hsl(126 42% 84%) 78%)',
    );
    expect(toScenarioTint(60)).toBe(
      'radial-gradient(circle at 50% 38%, hsl(0 70% 92%), hsl(0 60% 85%) 78%)',
    );
  });

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
