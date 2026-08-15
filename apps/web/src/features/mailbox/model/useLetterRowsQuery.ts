// 지금 보고 있는 칸의 편지 목록 — 받은/보낸 두 갈래를 리스트가 쓰는 한 모양으로 맞춰 돌려준다.
// 편지가 쌓이면 첫 장 밖으로 밀린다 — 더 보기로 다음 장을 이어 받는다
import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import type { MailboxPage, ReceivedLetter, SentFeedback } from '../api/letter';
import { getReceivedLetters, getSentFeedbacks } from '../api/letters';
import type { MailboxBox } from './box';
import { mailboxKeys } from './keys';
import { nextLetterCursor } from './letter-page';
import { toReceivedRow, toSentRow, type LetterRow } from './letter-row';

// 캐시에는 백엔드 응답을 그대로 담고, 줄 모양으로 바꾸는 건 select가 한다
const fetchLetters = (
  box: MailboxBox,
  cursor: string | null,
): Promise<MailboxPage<ReceivedLetter | SentFeedback>> =>
  box === 'sent' ? getSentFeedbacks(cursor) : getReceivedLetters(cursor);

// 어느 칸을 부른 응답인지는 호출한 쪽이 안다. 필드가 있나 없나로 알아맞히면
// 백엔드가 두 응답에 같은 필드를 실어 주는 순간 조용히 반대쪽으로 갈린다
const toRows = (
  box: MailboxBox,
  page: MailboxPage<ReceivedLetter | SentFeedback>,
): LetterRow[] =>
  box === 'sent'
    ? (page.items as SentFeedback[]).map(toSentRow)
    : (page.items as ReceivedLetter[]).map(toReceivedRow);

export const useLetterRowsQuery = (box: MailboxBox) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const {
    data,
    isPending,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: mailboxKeys.letters(userId, box),
    queryFn: ({ pageParam }) => fetchLetters(box, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: nextLetterCursor,
    select: (data) => data.pages.flatMap((page) => toRows(box, page)),
    enabled: userId !== null,
  });

  return {
    rows: data ?? null,
    // 로그인 전에는 쿼리가 돌지 않는다 — 그건 기다리는 게 아니라 볼 게 없는 것이다
    isPending: userId !== null && isPending,
    error,
    retry: () => void refetch(),
    hasMore: hasNextPage,
    loadingMore: isFetchingNextPage,
    loadMore: () => void fetchNextPage(),
  };
};
