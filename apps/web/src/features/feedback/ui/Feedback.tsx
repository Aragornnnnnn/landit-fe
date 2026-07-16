'use client';

// 피드백 화면 오케스트레이터 — 총평 ↔ 상세 두 단계를 전환한다
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';

import type { SessionFeedbackResponse } from '../api/session-feedback';
import { FeedbackDetail } from './FeedbackDetail';
import { FeedbackSummary } from './FeedbackSummary';

export const Feedback = ({
  feedback,
  title,
  onExit,
}: {
  feedback: SessionFeedbackResponse;
  title: string;
  onExit: () => void;
}) => {
  const [step, setStep] = useState<'summary' | 'detail'>('summary');

  useEffect(() => {
    track(EVENTS.FEEDBACK_VIEWED, {
      session_id: feedback.sessionId,
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

  return (
    <FeedbackSummary
      feedback={feedback}
      title={title}
      onBack={onExit}
      onDetail={() => {
        track(EVENTS.FEEDBACK_DETAIL_OPENED, {
          session_id: feedback.sessionId,
        });
        setStep('detail');
      }}
    />
  );
};
