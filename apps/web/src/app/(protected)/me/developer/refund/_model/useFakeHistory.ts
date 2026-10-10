// 가짜 환급 내역 — 서버 대신 받아 둔 줄을 한 장씩 늦게 내어 줘, 이어 받기와 실패를 폰에서 볼 수 있게 한다
import { useRef, useState } from 'react';

import type { RewardHistoryItem } from '@/features/reward/api/reward';
import { historyRowsOf } from '@/features/reward/model/reward-history';
import type { RewardHistoryState } from '@/features/reward/model/useRewardHistoryQuery';

import { FAKE_PAGE_SIZE, type HistoryMode } from './refund-check-cases';

// 서버가 답하는 데 걸리는 시간을 흉내 낸다
const RESPONSE_MS = 900;

export const useFakeHistory = (
  items: RewardHistoryItem[],
  mode: HistoryMode,
): RewardHistoryState => {
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const hasFailed = useRef(false);

  const all = mode === 'empty' ? [] : items;

  const loadMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    setMoreFailed(false);
    setTimeout(() => {
      setLoadingMore(false);
      if (mode === 'failOnce' && !hasFailed.current) {
        hasFailed.current = true;
        setMoreFailed(true);
        return;
      }
      setPages((count) => count + 1);
    }, RESPONSE_MS);
  };

  return {
    rows: historyRowsOf(all.slice(0, pages * FAKE_PAGE_SIZE)),
    error: null,
    retry: () => {},
    hasMore: pages * FAKE_PAGE_SIZE < all.length,
    fetching: loadingMore,
    loadingMore,
    moreFailed,
    loadMore,
  };
};
