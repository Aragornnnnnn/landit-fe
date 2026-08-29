// 발음 점수 표시 규칙 검증 — BE passed 기준 통과와 구간별 문구
import { describe, expect, it } from 'vitest';

import { feedbackCoachMessage, scoreView } from './pronunciation-score';

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

describe('feedbackCoachMessage', () => {
  it.each([
    [30, 3, '괜찮아요, 천천히 다시 해봐요!'],
    [55, 3, '좋아요! 빨간 단어들을 다듬어봐요'],
    [88, 1, '한 단어만 고치면 완벽해요!'],
    [80, 2, '두 단어만 고치면 완벽해요!'],
    [75, 3, '거의 다 왔어요! 조금만 다듬어봐요'],
  ])('%i점에 오류 %i개면 "%s"', (score, errorCount, message) => {
    expect(
      feedbackCoachMessage(scoreView({ score, passed: false }), errorCount),
    ).toBe(message);
  });
});
