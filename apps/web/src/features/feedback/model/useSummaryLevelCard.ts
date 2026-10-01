// 총평 영역 점수 카드 배선 — 응답 때 분석 중이었으면 수준 평가를 다시 묻고, 상한이 지나거나 조회가 실패하면 기다림을 끝낸다
import { useEffect, useEffectEvent, useState } from 'react';

import type { SessionFeedbackResponse } from '../api/session-feedback';
import { decideSummaryLevelCard, isAwaitingLevel } from './summary-level-card';
import { useLevelAssessmentQuery } from './useLevelAssessmentQuery';

// 이 시간 안에 결과가 안 오면 카드를 거둔다 (BE 자체 만료는 120초)
const LEVEL_WAIT_MS = 20_000;

export const useSummaryLevelCard = (feedback: SessionFeedbackResponse) => {
  const inline = feedback.userLevelAssessment;
  const waiting = isAwaitingLevel(inline);
  // 한 번 그만두면 되돌리지 않는다 — 실패 뒤 다음 폴링이 로딩을 되살려 카드가 깜빡이지 않게
  const [gaveUp, setGaveUp] = useState(false);
  const polled = useLevelAssessmentQuery(
    waiting && !gaveUp ? feedback.sessionId : null,
  );

  // 조회가 실패로 끝나면 그 자리에서 그만둔다 — 렌더 중 state 조정(ScenarioCard의 autoFlip과 같은 패턴)
  if (waiting && !gaveUp && polled.outcome === 'unavailable') setGaveUp(true);

  // 상한은 기다리기 시작할 때 한 번만 건다. 울릴 때 결과가 이미 왔으면 그대로 둔다 — 보여 준 카드를 거두지 않게
  const giveUpIfStillPending = useEffectEvent(() => {
    if (polled.outcome === 'pending') setGaveUp(true);
  });
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(giveUpIfStillPending, LEVEL_WAIT_MS);
    return () => clearTimeout(timer);
  }, [waiting]);

  return decideSummaryLevelCard({ inline, polled, gaveUp });
};
