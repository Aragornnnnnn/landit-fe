// 시나리오 기록 목록의 한 줄로 바꾼다 — 몇 번째 대화인지(오래된 회차부터), 끝낸 날, 그때 점수
import { toDayLabel } from '@/shared/lib/day-label';

import type { ScenarioHistorySession } from '../_api/scenario-history';

export interface SessionRow {
  sessionId: number;
  // 1부터 — 가장 먼저 완료한 회차가 1번째다
  ordinal: number;
  dayLabel: string;
  // 피드백이 저장되지 않은 회차면 null
  score: { starRating: number; nativeScore: number } | null;
}

/** BE가 최신 완료순으로 준 회차 전부를 그 순서 그대로 줄로 만든다 */
export const toSessionRows = (
  sessions: ScenarioHistorySession[],
): SessionRow[] =>
  sessions.map((session, index) => ({
    sessionId: session.sessionId,
    ordinal: sessions.length - index,
    dayLabel: toDayLabel(session.endedAt),
    score: session.feedback
      ? {
          starRating: session.feedback.starRating,
          nativeScore: session.feedback.nativeScore,
        }
      : null,
  }));
