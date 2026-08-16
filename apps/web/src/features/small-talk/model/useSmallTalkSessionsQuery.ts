// 지난 스몰톡 목록 — 완료한 대화만 최신순으로 온다.
// 하루 한 번 하는 대화라 첫 장으로 한참 버티지만, 쌓이면 옛 대화가 첫 장 밖으로 밀린다 — 더 보기로 이어 받는다
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getSmallTalkSessions } from '../api/small-talk';
import { smallTalkKeys } from './keys';

const PAGE_SIZE = 20;

export const useSmallTalkSessionsQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const {
    data,
    error,
    isPending,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: smallTalkKeys.sessions(userId),
    queryFn: ({ pageParam }) => getSmallTalkSessions(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    // 다음 장이 있다고 서버가 말할 때만 이어 받는다
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: userId !== null,
  });

  return {
    sessions: data ? data.pages.flatMap((page) => page.items) : null,
    error,
    isLoading: isPending,
    retry: () => void refetch(),
    hasMore: hasNextPage,
    loadingMore: isFetchingNextPage,
    loadMore: () => void fetchNextPage(),
  };
};
