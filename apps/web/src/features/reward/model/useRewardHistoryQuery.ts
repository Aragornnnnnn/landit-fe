'use client';

// 내 환급 내역 조회 — 늦은 것부터 한 장씩 받고, 끝까지 내리면 이어 받는다
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getRewardHistory, type RewardHistoryPage } from '../api/reward';
import { rewardKeys } from './keys';
import { historyRowsOf, nextHistoryCursor } from './reward-history';

// 캐시에는 백엔드 응답을 그대로 담고 줄로 바꾸는 건 여기서 한다 — 장을 넘어 날짜 꼬리표와 중복을 한 번에 본다.
// 훅 밖에 둬야 같은 함수로 남아, 받은 장이 그대로면 다시 계산하지 않는다
const rowsOf = (history: InfiniteData<RewardHistoryPage>) =>
  historyRowsOf(history.pages.flatMap((page) => page.items));

export const useRewardHistoryQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const {
    data,
    error,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: rewardKeys.history(userId),
    queryFn: ({ pageParam }) => getRewardHistory(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last, _pages, _asked, allAsked) =>
      nextHistoryCursor(last, allAsked),
    select: rowsOf,
    enabled: userId !== null,
    // 내역이 비어 보이는 시간이 길어지지 않게 한 번만 다시 묻는다
    retry: 1,
  });

  return {
    // 첫 장을 아직 받지 못했으면 null
    rows: data ?? null,
    // 첫 장을 받지 못했을 때만 — 다음 장 실패는 moreFailed로 따로 알려, 보던 내역을 그대로 둔다
    error: data === undefined ? error : null,
    retry: () => void refetch(),
    hasMore: hasNextPage,
    // 무엇이든 받는 중 — 처음부터 다시 받는 중에도 다음 장을 묻지 않게 하는 데 쓴다
    fetching: isFetching,
    loadingMore: isFetchingNextPage,
    moreFailed: isFetchNextPageError,
    // 돌고 있는 요청이 있으면 끊지 않는다 — 처음부터 다시 받는 중에 끊으면 앞쪽 줄이 옛 값으로 남는다
    loadMore: () => void fetchNextPage({ cancelRefetch: false }),
  };
};
