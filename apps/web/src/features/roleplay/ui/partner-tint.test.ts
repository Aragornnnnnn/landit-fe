// 시나리오 카드 바탕 — 많이 쌓여도 구분되게 시나리오마다 색이 다르되, 한번 정해진 색은 바뀌지 않는다
import { describe, expect, it } from 'vitest';

import { SCENARIO_TINTS, toScenarioTint } from './partner-tint';

describe('toScenarioTint', () => {
  it('바탕색은 서로 다른 60가지다', () => {
    expect(SCENARIO_TINTS).toHaveLength(60);
    expect(new Set(SCENARIO_TINTS).size).toBe(60);
  });

  it('번호마다 정해진 색은 코드가 바뀌어도 그대로다', () => {
    // Then 스냅샷이 달라지면 사용자의 카드 색이 바뀐다 — 출시 뒤에는 갱신하지 않는다
    const tints = Array.from({ length: 60 }, (_, index) =>
      toScenarioTint(index + 1),
    );

    expect(tints).toMatchSnapshot();
  });

  it('가짓수를 넘는 id도 같은 차례의 색을 고른다', () => {
    expect(toScenarioTint(61)).toBe(toScenarioTint(1));
  });
});
