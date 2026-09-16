// 발음 점수 표시 규칙 검증 — BE passed 기준 통과와 구간별 문구
import { describe, expect, it } from 'vitest';

import { scoreView } from './pronunciation-score';

describe('scoreView', () => {
  it('BE가 통과라고 하면 100% Perfect로 보여준다', () => {
    expect(scoreView({ score: 100, passed: true })).toEqual({
      display: 100,
      label: 'Perfect!',
      tone: 'green',
      passed: true,
    });
  });

  it('BE가 통과가 아니면 점수가 높아도 통과로 바꾸지 않는다 — 판정은 서버가 단일 출처', () => {
    expect(scoreView({ score: 99, passed: false })).toEqual({
      display: 99,
      label: 'Great!',
      tone: 'green',
      passed: false,
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
    expect(scoreView({ score, passed: false })).toEqual({
      display: score,
      label,
      tone,
      passed: false,
    });
  });
});
