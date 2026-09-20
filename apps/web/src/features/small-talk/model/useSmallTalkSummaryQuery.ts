// 오늘의 스몰톡 요약 조회 — 표현 재사용·후속 질문은 대화가 끝난 뒤 따로 만들어져서, 준비될 때까지(pending) 다시 묻는다
'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  getSmallTalkSummary,
  type SmallTalkSummaryResponse,
} from '../api/small-talk';
import { smallTalkKeys } from './keys';

// 다시 묻는 간격
const POLL_MS = 1_000;
// 기다림의 상한. 이만큼 기다려도 안 오면 그 블록은 비운 채로 둔다 — 다시 들어오면 처음부터 묻는다
export const SUMMARY_WAIT_LIMIT_MS = 60_000;

// 아직 만드는 중인 블록이 있는가
const isStillPreparing = (summary: SmallTalkSummaryResponse | undefined) =>
  summary !== undefined &&
  (summary.reusedExpressions.pending || summary.followUp.pending);

export const useSmallTalkSummaryQuery = (sessionId: number) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  // 기다린 지 오래됐는가 — 상한을 넘기면 그만 묻는다
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  const { data, error, isFetching, refetch } = useQuery({
    queryKey: smallTalkKeys.summary(userId, sessionId),
    queryFn: () => getSmallTalkSummary(sessionId),
    refetchInterval: (query) =>
      isStillPreparing(query.state.data) && !waitedTooLong ? POLL_MS : false,
  });

  const preparing = isStillPreparing(data);
  useEffect(() => {
    if (!preparing) return;
    const limit = setTimeout(
      () => setWaitedTooLong(true),
      SUMMARY_WAIT_LIMIT_MS,
    );
    return () => clearTimeout(limit);
  }, [preparing]);

  // 이미 받아 둔 요약이 있으면 실패를 화면에 올리지 않는다 — 폴링 한 번 끊겼다고 보던 것이 사라지면 안 된다.
  // 받아 둔 게 없어도 다시 받아오는 중이면 기다리는 화면을 보여준다 (미리 받아 두기가 실패한 뒤 도착한 경우)
  const settledError = data || isFetching ? null : error;

  return {
    summary: data ?? null,
    error: settledError,
    isLoading: !data && settledError === null,
    // 상한까지 기다려 그만 묻는 상태 — 아직 pending인 블록은 스켈레톤 대신 비운다
    waitExpired: waitedTooLong,
    retry: () => void refetch(),
  };
};
