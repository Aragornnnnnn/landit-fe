'use client';

// 내 환급 내역 조회 — 늦은 것부터 한 장씩 받고, 끝까지 내리면 이어 받는다. 결제한 사람의 내역과 무료로 한 날의 기록이 같은 방식이다
import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  getRewardHistory,
  getRewardPreviewHistory,
  type RewardHistoryPage,
  type RewardPreviewHistoryPage,
} from '../api/reward';
import { rewardKeys } from './keys';
import { missedRowsOf } from './missed-reward';
import {
  historyRowsOf,
  nextHistoryCursor,
  type HistoryRow,
} from './reward-history';

// 캐시에는 백엔드 응답을 그대로 담고 줄로 바꾸는 건 여기서 한다 — 장을 넘어 날짜 꼬리표와 중복을 한 번에 본다.
// 훅 밖에 둬야 같은 함수로 남아, 받은 장이 그대로면 다시 계산하지 않는다
const rowsOf = (history: InfiniteData<RewardHistoryPage>) =>
  historyRowsOf(history.pages.flatMap((page) => page.items));

// 내역 영역이 그리는 데 쓰는 값 — 조회 훅이 채우고, 환급 점검 화면은 가짜로 채운다
export interface RewardHistoryState<Row = HistoryRow> {
  rows: Row[] | null;
  error: Error | null;
  retry: () => void;
  hasMore: boolean;
  fetching: boolean;
  loadingMore: boolean;
  moreFailed: boolean;
  loadMore: () => void;
}

const useHistoryPagesQuery = <
  Page extends RewardHistoryPage | RewardPreviewHistoryPage,
  Row,
>({
  queryKey,
  fetchPage,
  select,
  enabled,
}: {
  queryKey: QueryKey;
  fetchPage: (cursor: string | null) => Promise<Page>;
  select: (data: InfiniteData<Page, string | null>) => Row[];
  enabled: boolean;
}): RewardHistoryState<Row> => {
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
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last, _pages, _asked, allAsked) =>
      nextHistoryCursor(last, allAsked),
    select,
    enabled,
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

export const useRewardHistoryQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  return useHistoryPagesQuery({
    queryKey: rewardKeys.history(userId),
    fetchPage: getRewardHistory,
    select: rowsOf,
    enabled: userId !== null,
  });
};

/**
 * 무료로 한 날의 기록 — 놓친 환급액 화면이 쓴다.
 *
 * @param today 서버가 정한 오늘 — 그 날짜 줄을 오늘로 적는다
 */
export const useRewardPreviewHistoryQuery = (today: string | null) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  return useHistoryPagesQuery({
    queryKey: rewardKeys.previewHistory(userId),
    fetchPage: getRewardPreviewHistory,
    select: (history: InfiniteData<RewardPreviewHistoryPage, string | null>) =>
      missedRowsOf(
        history.pages.flatMap((page) => page.items),
        today,
      ),
    enabled: userId !== null,
  });
};
