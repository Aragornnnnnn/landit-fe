// 시나리오 하나로 한 지난 대화 — 행마다 몇 번째 대화인지 매기므로 끝까지 받는다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplaySessions } from '../api/roleplay';
import { fetchAllPages } from './fetch-all-pages';
import { roleplayKeys } from './keys';

export const useRoleplayHistoryQuery = (roleplayId: number) => {
  const userId = useCurrentUserId();
  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.history(userId, roleplayId),
    queryFn: () =>
      fetchAllPages((page) => getRoleplaySessions(roleplayId, page)),
    enabled: userId !== null,
  });

  return {
    sessions: data ?? null,
    error: data === undefined ? error : null,
    retry: () => void refetch(),
  };
};
