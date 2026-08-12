// 지난 스몰톡 목록 — 완료한 대화만 최신순으로 온다.
// 페이지는 아직 안 넘긴다. 하루 한 번 하는 대화라 첫 장으로 한참 버틴다 (hasNext는 받아만 둔다)
'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getSmallTalkSessions } from '../api/small-talk';
import { smallTalkKeys } from './keys';

export const useSmallTalkSessionsQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: smallTalkKeys.sessions(userId),
    queryFn: () => getSmallTalkSessions(),
    enabled: userId !== null,
  });

  return {
    sessions: data?.items ?? null,
    error,
    isLoading: isPending,
    retry: () => void refetch(),
  };
};
