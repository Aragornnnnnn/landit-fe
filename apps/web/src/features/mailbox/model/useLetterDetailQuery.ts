// 편지 한 통 조회 — 받은 편지와 보낸 피드백은 리소스가 달라 조회도 따로 연다
import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';
import { useAuthStore } from '@/shared/auth/auth-store';

import { getReceivedLetterDetail, getSentFeedbackDetail } from '../api/letters';
import { mailboxKeys } from './keys';

// 없는 편지를 다시 물어도 답은 같다 — 기본 재시도(3회 지수 백오프)에 걸리면
// 못 찾았다는 사실을 알기까지 7초를 스켈레톤만 본다
const retryUnlessMissing = (failureCount: number, error: Error) => {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < 2;
};

const useLetterQuery = <T>(
  box: 'received' | 'sent',
  id: number,
  fetch: () => Promise<T>,
) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: mailboxKeys.letter(userId, box, id),
    queryFn: fetch,
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

// 받은 편지는 조회가 읽음 처리를 겸한다 — 따로 알릴 API가 없다
export const useReceivedLetterQuery = (letterId: number) =>
  useLetterQuery('received', letterId, () => getReceivedLetterDetail(letterId));

export const useSentFeedbackQuery = (feedbackId: number) =>
  useLetterQuery('sent', feedbackId, () => getSentFeedbackDetail(feedbackId));
