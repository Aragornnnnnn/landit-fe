// 기록을 언제 다시 받을지 — 끝난 회차는 바뀌지 않지만, 막 끝나 피드백이 만들어지는 중인 회차는 곧 채워진다
import { describe, expect, it } from 'vitest';

import type { ScenarioHistoryResponse } from '../_api/scenario-history';
import { historyStaleTime } from './history-freshness';

// 서버 시각은 시간대 없는 서울 시각이다 — 2026-09-30 21:10:00 KST
const NOW = Date.parse('2026-09-30T21:10:00+09:00');

const history = (
  sessions: { endedAt: string; hasFeedback: boolean }[],
): ScenarioHistoryResponse => ({
  scenarioId: 12,
  sessions: sessions.map(({ endedAt, hasFeedback }, index) => ({
    sessionId: index + 1,
    startedAt: endedAt,
    endedAt,
    messages: [],
    feedback: (hasFeedback
      ? {}
      : null) as ScenarioHistoryResponse['sessions'][number]['feedback'],
  })),
});

describe('historyStaleTime', () => {
  it('모든 회차에 피드백이 있으면 다시 받지 않는다 — 회차마다 대화 전부가 실려 무겁다', () => {
    const data = history([
      { endedAt: '2026-09-30T21:05:00', hasFeedback: true },
    ]);

    expect(historyStaleTime(data, NOW)).toBe(Infinity);
  });

  it('방금 끝난 회차에 피드백이 아직 없으면 볼 때마다 다시 받는다 — 만들어지는 중이다', () => {
    const data = history([
      { endedAt: '2026-09-30T21:05:00', hasFeedback: false },
    ]);

    expect(historyStaleTime(data, NOW)).toBe(0);
  });

  it('오래전에 끝났는데 피드백이 없는 회차는 앞으로도 안 생긴다 — 그것 때문에 계속 다시 받지 않는다', () => {
    const data = history([
      { endedAt: '2026-09-29T09:00:00', hasFeedback: false },
    ]);

    expect(historyStaleTime(data, NOW)).toBe(Infinity);
  });

  it('아직 받은 게 없으면 다시 받을 대상이다', () => {
    expect(historyStaleTime(undefined, NOW)).toBe(0);
  });
});
