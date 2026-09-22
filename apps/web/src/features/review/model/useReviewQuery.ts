// 푸시 복습 상태 조회 — 알림으로 들어온 첫 진입 상태만 받는다. 이후 진행 상태는 시작·제출 응답이 준다
import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';

import { getReview } from '../api/review';
import { reviewKeys } from './keys';

// 4xx는 다시 물어도 답이 같다(없는 복습·남의 복습·기한 지남) — 기본 재시도(3회 지수 백오프)에 걸리면
// 안내가 뜨기까지 7초를 빈 화면으로 기다린다. 오래된 알림을 누르는 건 이 화면의 흔한 입력이다
const MAX_RETRIES = 2;

export const isRetriableFailure = (error: Error) =>
  !(error instanceof ApiError) || error.status >= 500;

const retryUnlessClientError = (failureCount: number, error: Error) =>
  isRetriableFailure(error) && failureCount < MAX_RETRIES;

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
