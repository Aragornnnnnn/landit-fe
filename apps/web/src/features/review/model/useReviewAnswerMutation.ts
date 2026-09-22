// 답안 제출 — 채점은 서버가 한다. 같은 시도를 다시 보낼 때만 제출 id를 재사용해 중복 채점을 막는다
import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

import { showToast } from '@/shared/ui/toast';

import { submitReviewAnswer } from '../api/review';
import { submissionFor, type PendingSubmission } from './review-submission';

export const useReviewAnswerMutation = (reviewId: string) => {
  // 아직 판정을 못 받은 제출 — 전송이 실패하면 같은 id로 다시 보낸다
  const pending = useRef<PendingSubmission | null>(null);

  return useMutation({
    mutationFn: (attempt: { questionId: string; words: string[] }) => {
      const submission = submissionFor(
        pending.current,
        attempt.questionId,
        attempt.words,
        () => crypto.randomUUID(),
      );
      pending.current = submission;
      return submitReviewAnswer(reviewId, submission);
    },
    // 판정을 받았으면 다음 답안은 새 제출이다
    onSuccess: () => {
      pending.current = null;
    },
    onError: (error) => showToast(error.message),
  });
};
