// 복습 시작 — 첫 문제를 받기 위한 한 번의 요청. 이미 시작한 복습은 서버가 진행 중 상태를 그대로 준다
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { reportError } from '@/shared/monitoring/report';
import { showToast } from '@/shared/ui/toast';

import { startReview, type Review } from '../api/review';
import { reviewKeys } from './keys';

export const useStartReviewMutation = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => startReview(reviewId),
    // 시작한 상태를 캐시에도 넣는다 — 중간에 나갔다 다시 들어와도 시작 안내부터 되풀이하지 않게
    onSuccess: (started: Review) =>
      queryClient.setQueryData(reviewKeys.detail(reviewId), started),
    // 시작하지 못한 이유(기한·권한)는 서버 문구가 가장 정확하다. 원인은 따로 남긴다
    onError: (error) => {
      reportError(error);
      showToast(error.message);
    },
  });
};
