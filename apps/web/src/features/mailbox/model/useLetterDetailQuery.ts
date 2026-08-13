// 편지 한 통 조회
import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';
import { useAuthStore } from '@/shared/auth/auth-store';

import { getLetterDetail } from '../api/letters';
import { mailboxKeys } from './keys';

// 없는 편지를 다시 물어도 답은 같다 — 기본 재시도(3회 지수 백오프)에 걸리면
// 못 찾았다는 사실을 알기까지 7초를 스켈레톤만 본다
const retryUnlessMissing = (failureCount: number, error: Error) => {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 2;
};

export const useLetterDetailQuery = (letterId: number) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: mailboxKeys.letter(userId, letterId),
    queryFn: () => getLetterDetail(letterId),
    enabled: userId !== null,
    retry: retryUnlessMissing,
  });

  return {
    letter: data ?? null,
    // 로그인 전에는 쿼리가 돌지 않는다 — 그건 기다리는 게 아니라 볼 게 없는 것이다
    isPending: userId !== null && isPending,
    error,
    retry: () => void refetch(),
  };
};
