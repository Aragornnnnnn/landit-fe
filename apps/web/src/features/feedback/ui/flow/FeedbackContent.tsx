'use client';

// 피드백 본편 — 로딩 분기(Flow)가 끝난 뒤 총평 ↔ 상세 두 단계를 전환한다.
// 서버가 상세를 잠근 세션이면 상세로 넘어가지 않고 호출부(페이월)에 맡긴다
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';

import type { SessionFeedbackResponse } from '../../api/session-feedback';
import { FeedbackDetail } from './FeedbackDetail';
import { FeedbackSummary } from './FeedbackSummary';

export const FeedbackContent = ({
  feedback,
  title,
  openDetail = false,
  refreshing = false,
  onExit,
  onDetailLocked,
}: {
  feedback: SessionFeedbackResponse;
  title: string;
  /** 총평을 건너뛰고 상세부터 — 결제하고 돌아온 길. 잠금이 풀린 응답이 오는 순간 한 번 연다 */
  openDetail?: boolean;
  /** 받아 둔 응답을 다시 받는 중 — 그동안 잠긴 CTA를 눌러도 페이월로 보내지 않는다 */
  refreshing?: boolean;
  onExit: () => void;
  /** 잠긴 상세를 보려고 했다 — 호출부가 페이월로 보낸다 */
  onDetailLocked: () => void;
}) => {
  const detailLocked = feedback.detailFeedbackLocked ?? false;
  // 상세는 서버가 열어 줬고 볼 턴이 있을 때만 들어간다 — 빈 상세 화면은 없다
  const detailAvailable = !detailLocked && feedback.messageFeedbacks.length > 0;
  const [step, setStep] = useState<'summary' | 'detail'>('summary');
  // 결제하고 돌아온 길은 상세부터 — 마운트 때는 아직 잠긴 옛 응답일 수 있어, 풀린 응답이 오는 순간 한 번만 연다.
  // 렌더 중 state 조정 패턴(effect 아님, ScenarioCard의 autoFlip과 같다) — 사용자가 이후 총평으로 돌아가는 건 막지 않는다
  const [detailOpened, setDetailOpened] = useState(false);
  if (openDetail && detailAvailable && !detailOpened) {
    setDetailOpened(true);
    setStep('detail');
  }

  // 결제하고 돌아와 저절로 열린 상세도 클릭으로 연 것과 같이 남긴다 — 안 남기면 결제한 사람만 지표에서 빠진다
  useEffect(() => {
    if (!detailOpened) return;
    track(EVENTS.FEEDBACK_DETAIL_OPENED, { session_id: feedback.sessionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 한 번 열리면 되돌지 않는다
  }, [detailOpened]);

  useEffect(() => {
    track(EVENTS.FEEDBACK_VIEWED, {
      session_id: feedback.sessionId,
      detail_locked: detailLocked,
      good_count: feedback.messageFeedbacks.filter(
        (turn) => turn.feedbackType === 'GOOD',
      ).length,
      turn_count: feedback.messageFeedbacks.length,
      native_score: feedback.nativeScore,
      star_rating: feedback.starRating,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 노출 1회 기록
  }, []);

  if (step === 'detail') {
    return (
      <FeedbackDetail
        sessionId={feedback.sessionId}
        turns={feedback.messageFeedbacks}
        onBack={() => setStep('summary')}
        onDone={() => {
          track(EVENTS.FEEDBACK_COMPLETED, { session_id: feedback.sessionId });
          onExit();
        }}
      />
    );
  }

  const openDetailStep = () => {
    if (detailLocked) {
      // 다시 받는 중이면 곧 풀릴 수 있다 — 방금 결제한 사람을 페이월로 되돌리지 않는다
      if (!refreshing) onDetailLocked();
      return;
    }
    // 서버가 열어 줬는데 볼 턴이 없다 — 상세 없이 마친 것으로 본다
    if (!detailAvailable) {
      onExit();
      return;
    }
    track(EVENTS.FEEDBACK_DETAIL_OPENED, { session_id: feedback.sessionId });
    setStep('detail');
  };

  return (
    <FeedbackSummary
      feedback={feedback}
      title={title}
      detailLocked={detailLocked}
      refreshing={refreshing}
      // 총평만 보고 상세 없이 나감 — Feedback Completed와 배타적인 이탈 신호
      onBack={() => {
        track(EVENTS.FEEDBACK_SKIPPED, { session_id: feedback.sessionId });
        onExit();
      }}
      onDetail={openDetailStep}
    />
  );
};
