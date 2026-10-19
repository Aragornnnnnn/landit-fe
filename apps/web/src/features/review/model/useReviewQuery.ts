// 푸시 복습 상태 조회 — 알림으로 들어온 첫 진입 상태만 받는다. 이후 진행 상태는 시작·제출 응답이 준다
import { useQuery } from '@tanstack/react-query';

import { retryUnlessClientError } from '@/shared/api/retry';

import { getReview } from '../api/review';
import { reviewKeys } from './keys';

export const useReviewQuery = (reviewId: string) => {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: reviewKeys.detail(reviewId),
    queryFn: () => getReview(reviewId),
    // 진행은 서버 응답으로 따라가므로 백그라운드 리페치가 화면을 되감지 않게 고정한다.
    // 대신 시작·채점 응답을 캐시에도 써 넣어(ReviewFlow) 다시 들어와도 과거를 보지 않는다
    staleTime: Infinity,
    retry: retryUnlessClientError,
  });

  return { review: data ?? null, error, isLoading: isPending, refetch };
};
