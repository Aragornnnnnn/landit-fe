// 복습 시작 — 첫 문제를 받기 위한 한 번의 요청. 이미 시작한 복습은 서버가 진행 중 상태를 그대로 준다
import { useMutation } from '@tanstack/react-query';

import { showToast } from '@/shared/ui/toast';

import { startReview } from '../api/review';

export const useStartReviewMutation = (reviewId: string) =>
  useMutation({
    mutationFn: () => startReview(reviewId),
    // 시작하지 못한 이유(기한·권한)는 서버 문구가 가장 정확하다
    onError: (error) => showToast(error.message),
  });
