// 시나리오 기록 목록의 한 줄 — 몇 번째 대화인지, 언제였는지, 그때 점수가 어땠는지
import { describe, expect, it } from 'vitest';

import type { SessionFeedbackResponse } from '@/features/feedback/api/session-feedback';

import type { ScenarioHistorySession } from '../_api/scenario-history';
import { toSessionRows } from './session-rows';

const session = (
  sessionId: number,
  endedAt: string,
  feedback: Partial<SessionFeedbackResponse> | null = {
    starRating: 2,
    nativeScore: 53,
  },
): ScenarioHistorySession => ({
  sessionId,
  startedAt: endedAt,
  endedAt,
  messages: [],
  feedback: feedback as SessionFeedbackResponse | null,
});

describe('toSessionRows', () => {
  it('최신순으로 온 회차를 그대로 두고, 몇 번째 대화인지는 가장 오래된 회차부터 센다', () => {
    const rows = toSessionRows([
      session(30, '2026-09-30T21:00:00'),
      session(20, '2026-09-28T09:00:00'),
      session(10, '2026-09-20T10:00:00'),
    ]);

    expect(rows.map((row) => [row.sessionId, row.ordinal])).toEqual([
      [30, 3],
      [20, 2],
      [10, 1],
    ]);
  });

  it('끝낸 날을 그 날짜 그대로 읽히는 표기로 단다 — 늦은 밤도 그 날로 남는다', () => {
    const [row] = toSessionRows([session(1, '2026-09-29T23:50:00')]);

    expect(row.dayLabel).toBe('9월 29일');
  });

  it('피드백이 있으면 그때 별점과 원어민 이해도를 싣는다', () => {
    const [row] = toSessionRows([session(1, '2026-09-29T10:00:00')]);

    expect(row.score).toEqual({ starRating: 2, nativeScore: 53 });
  });

  it('피드백이 저장되지 않은 회차는 점수 없이 둔다 — 조회가 피드백을 새로 만들지 않는다', () => {
    const [row] = toSessionRows([session(1, '2026-09-29T10:00:00', null)]);

    expect(row.score).toBeNull();
  });
});
