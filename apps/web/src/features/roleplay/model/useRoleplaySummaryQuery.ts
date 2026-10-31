// 오늘의 롤플레이 요약 조회 — 총평과 배운 표현 재사용이 대화가 끝난 뒤 만들어져서, 준비될 때까지(pending) 다시 묻는다
'use client';

import { useEffect, useState } from 'react';
import {
  queryOptions,
  useQuery,
  type QueryClient,
} from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import {
  getRoleplaySummary,
  type RoleplaySummaryResponse,
} from '../api/roleplay';
import { roleplayKeys } from './keys';

// 다시 묻는 간격
const POLL_MS = 1_000;
// 기다림의 상한 — 스몰톡 요약과 같은 값. 이만큼 기다려도 안 오면 그 블록은 비운 채로 둔다
export const ROLEPLAY_SUMMARY_WAIT_LIMIT_MS = 60_000;

// 아직 만드는 중인 것이 있는가 — 총평은 교정이 끝나길, 배운 표현 재사용은 종료 후 잡을 기다린다
const isStillPreparing = (summary: RoleplaySummaryResponse | undefined) =>
  summary !== undefined &&
  (summary.pending || summary.reusedExpressions.pending);

const summaryQuery = (userId: number | null, sessionId: number) =>
  queryOptions({
    queryKey: roleplayKeys.summary(userId, sessionId),
    queryFn: () => getRoleplaySummary(sessionId),
  });

// 대화가 끝나는 자리에서 미리 받아 둔다 — 축하를 보는 동안 요약이 도착하면 다음 화면이 스켈레톤 없이 선다
export const prefetchRoleplaySummary = (
  queryClient: QueryClient,
  userId: number | null,
  sessionId: number,
) => queryClient.prefetchQuery(summaryQuery(userId, sessionId));

export const useRoleplaySummaryQuery = (sessionId: number) => {
  const userId = useCurrentUserId();
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  const { data, error, isFetching, refetch } = useQuery({
    ...summaryQuery(userId, sessionId),
    refetchInterval: (query) =>
      isStillPreparing(query.state.data) && !waitedTooLong ? POLL_MS : false,
  });

  const preparing = isStillPreparing(data);
  useEffect(() => {
    if (!preparing) return;
    const limit = setTimeout(
      () => setWaitedTooLong(true),
      ROLEPLAY_SUMMARY_WAIT_LIMIT_MS,
    );
    return () => clearTimeout(limit);
  }, [preparing]);

  // 받아 둔 요약이 있으면 폴링 한 번의 실패를 화면에 올리지 않는다
  const settledError = data || isFetching ? null : error;

  return {
    summary: data ?? null,
    error: settledError,
    isLoading: !data && settledError === null,
    waitExpired: waitedTooLong,
    retry: () => void refetch(),
  };
};
