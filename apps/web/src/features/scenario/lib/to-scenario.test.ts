// 날짜별 응답 → 카드 모양 변환 검증 — 잠금 판정을 서버 값에서 가져오는지가 계약이다
import { describe, expect, it } from 'vitest';

import type { DailyScenario } from '../api/daily';
import { toScenario } from './to-scenario';

const daily = (overrides: Partial<DailyScenario> = {}): DailyScenario => ({
  scenarioId: 12,
  scenarioTitle: '기숙사 룸메이트와 첫인사',
  briefing: '오늘 막 입주한 룸메이트에게 먼저 말을 걸어볼게요.',
  conversationGoal: '처음 만난 상대에게 인사할 수 있다.',
  thumbnailUrl: '/thumb.webp',
  difficulty: 'NORMAL',
  firstSpeaker: 'AI',
  dailyScenarioType: 'NEW',
  openingPreview: null,
  completed: false,
  completedAt: null,
  starRating: null,
  expressionCount: 5,
  completedExpressionCount: 2,
  ...overrides,
});

describe('toScenario', () => {
  it('시작할 수 있는 날은 잠기지 않은 카드가 된다', () => {
    // Given 서버가 시작 가능하다고 판정한 시나리오에서
    // When 카드 모양으로 바꾸면
    // Then 카드가 잠기지 않는다
    expect(toScenario(daily(), true).locked).toBe(false);
  });

  it('시작할 수 없는 날은 잠긴 카드가 된다', () => {
    // Given 시나리오는 있지만 서버가 시작 불가로 판정한 날에서
    // When 카드 모양으로 바꾸면
    // Then 잠금 판정을 서버 값에서 그대로 가져온다 (상태 조합으로 유추하지 않는다)
    expect(toScenario(daily(), false).locked).toBe(true);
  });

  it('카드가 그리는 값들을 그대로 옮긴다', () => {
    // Given 완료한 날의 시나리오에서
    const cleared = toScenario(
      daily({
        dailyScenarioType: 'CLEARED',
        completed: true,
        starRating: 3,
      }),
      true,
    );

    // When 카드 모양으로 바꾸면
    // Then 제목·썸네일·별점·완료 여부가 그대로 실린다
    expect(cleared).toMatchObject({
      scenarioId: 12,
      scenarioTitle: '기숙사 룸메이트와 첫인사',
      thumbnailUrl: '/thumb.webp',
      starRating: 3,
      completed: true,
    });
  });
});
