// 총평 영역 점수 카드 배선 — 응답 때 분석 중이었으면 수준 평가를 다시 묻고, 상한이 지나면 기다림을 끝낸다
import { useEffect, useState } from 'react';

import type { SessionFeedbackResponse } from '../api/session-feedback';
import { decideSummaryLevelCard, isAwaitingLevel } from './summary-level-card';
import { useLevelAssessmentQuery } from './useLevelAssessmentQuery';

// 이 시간 안에 결과가 안 오면 카드를 거둔다 (BE 자체 만료는 120초)
const LEVEL_WAIT_MS = 20_000;

export const useSummaryLevelCard = (feedback: SessionFeedbackResponse) => {
  const inline = feedback.userLevelAssessment;
  const waiting = isAwaitingLevel(inline);
  const [timedOut, setTimedOut] = useState(false);
  // 상한이 지나면 더 묻지 않는다 — 카드는 이미 거뒀다
  const polled = useLevelAssessmentQuery(
    waiting && !timedOut ? feedback.sessionId : null,
  );
  // 결과가 오면(ready·unavailable) 타이머를 끊는다 — 상한이 이미 보여 준 카드를 거두지 않게
  const stillWaiting = waiting && polled.outcome === 'pending';

  useEffect(() => {
    if (!stillWaiting) return;
    const timer = setTimeout(() => setTimedOut(true), LEVEL_WAIT_MS);
    return () => clearTimeout(timer);
  }, [stillWaiting]);

  return decideSummaryLevelCard({ inline, polled, timedOut });
};
