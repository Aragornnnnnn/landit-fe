// 편지 한 통 조회 — 받은 편지와 보낸 피드백은 리소스가 달라 조회도 따로 연다
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';
import { useAuthStore } from '@/shared/auth/auth-store';

import { getReceivedLetterDetail, getSentFeedbackDetail } from '../api/mailbox';
import type { MailboxBox } from './box';
import { mailboxKeys } from './keys';

// 4xx는 다시 물어도 답이 같다(없는 편지·권한 없음) — 기본 재시도(3회 지수 백오프)에 걸리면
// 못 찾았다는 사실을 알기까지 7초를 스켈레톤만 본다. 5xx만 두 번까지 다시 묻는다
const DETAIL_MAX_RETRIES = 2;
const retryUnlessClientError = (failureCount: number, error: Error) => {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < DETAIL_MAX_RETRIES;
};

const useLetterQuery = <T>(
  box: MailboxBox,
  id: number,
  queryFn: () => Promise<T>,
) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: mailboxKeys.letter(userId, box, id),
    queryFn,
    enabled: userId !== null,
    retry: retryUnlessClientError,
  });

  return {
    letter: data ?? null,
    // 로그인 전에는 쿼리가 돌지 않는다 — 그건 기다리는 게 아니라 볼 게 없는 것이다
    isPending: userId !== null && isPending,
    error,
    retry: () => void refetch(),
  };
};

// 받은 편지는 조회가 읽음 처리를 겸한다 — 따로 알릴 API가 없다.
// 그래서 받고 나면 목록의 미읽음 표시와 헤더의 개수가 낡는다. 그 둘(summaries)만 다시 묻게 한다 —
// 방금 받은 상세는 그대로 두고, 값을 직접 깎지도 않는다. 이미 읽은 편지를 또 열었는지
// 응답만 보고는 알 수 없어(열면 언제나 읽음이다) 깎으면 틀린다
export const useReceivedLetterQuery = (letterId: number) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();

  return useLetterQuery('received', letterId, async () => {
    const letter = await getReceivedLetterDetail(letterId);
    void queryClient.invalidateQueries({
      queryKey: mailboxKeys.summaries(userId),
    });
    return letter;
  });
};

export const useSentFeedbackQuery = (feedbackId: number) =>
  useLetterQuery('sent', feedbackId, () => getSentFeedbackDetail(feedbackId));
