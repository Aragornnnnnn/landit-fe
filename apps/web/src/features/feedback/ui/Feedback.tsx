'use client';

// 피드백 화면 오케스트레이터 — 총평 ↔ 상세 두 단계를 전환한다
import { useState } from 'react';

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

  if (step === 'detail') {
    return (
      <FeedbackDetail
        turns={feedback.messageFeedbacks}
        onBack={() => setStep('summary')}
        onDone={onExit}
      />
    );
  }

  return (
    <FeedbackSummary
      feedback={feedback}
      title={title}
      onBack={onExit}
      onDetail={() => setStep('detail')}
    />
  );
};
