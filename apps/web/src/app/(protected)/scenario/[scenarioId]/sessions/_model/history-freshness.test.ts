// 기록을 언제 다시 받을지 — 끝난 회차는 바뀌지 않지만, 피드백이 아직 없는 회차는 곧 채워질 수 있다
import { describe, expect, it } from 'vitest';

import type { ScenarioHistoryResponse } from '../_api/scenario-history';
import { historyStaleTime } from './history-freshness';

const history = (feedbacks: (object | null)[]): ScenarioHistoryResponse => ({
  scenarioId: 12,
  sessions: feedbacks.map((feedback, index) => ({
    sessionId: index + 1,
    startedAt: '2026-09-30T21:00:00',
    endedAt: '2026-09-30T21:10:00',
    messages: [],
    feedback:
      feedback as ScenarioHistoryResponse['sessions'][number]['feedback'],
  })),
});

describe('historyStaleTime', () => {
  it('모든 회차에 피드백이 있으면 다시 받지 않는다 — 회차마다 대화 전부가 실려 무겁다', () => {
    expect(historyStaleTime(history([{}, {}]))).toBe(Infinity);
  });

  it('피드백이 아직 없는 회차가 있으면 볼 때마다 다시 받는다 — 대화를 막 마치고 들어오면 피드백이 만들어지는 중이다', () => {
    expect(historyStaleTime(history([null, {}]))).toBe(0);
  });

  it('아직 받은 게 없으면 다시 받을 대상이다', () => {
    expect(historyStaleTime(undefined)).toBe(0);
  });
});
