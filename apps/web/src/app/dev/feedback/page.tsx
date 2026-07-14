'use client';

// [임시] 피드백 UI 프리뷰(개발 전용) — 로그인 없이 고정 대본으로 화면을 확인한다. 프로덕션에선 404.
import { notFound } from 'next/navigation';

import { FEEDBACK_FIXTURE } from '@/features/feedback/model/feedback-fixture';
import { Feedback } from '@/features/feedback/ui/Feedback';

export default function FeedbackPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <Feedback
      feedback={FEEDBACK_FIXTURE}
      title="카페에서 주문하기"
      onExit={() => {}}
    />
  );
}
