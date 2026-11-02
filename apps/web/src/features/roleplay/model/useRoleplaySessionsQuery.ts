// 시나리오 하나로 한 지난 대화 — 화면 제목에 총횟수를 보여 주므로 다음 장이 있으면 끝까지 받아 이어 붙인다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import {
  getRoleplaySessions,
  type RoleplayHistorySummary,
} from '../api/roleplay';
import { roleplayKeys } from './keys';

const getAllRoleplaySessions = async (roleplayId: number) => {
  const items: RoleplayHistorySummary[] = [];
  for (let page = 0; ; page++) {
    const received = await getRoleplaySessions(roleplayId, page);
    items.push(...received.items);
    if (!received.hasNext) return items;
  }
};

export const useRoleplaySessionsQuery = (roleplayId: number) => {
  const userId = useCurrentUserId();
  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.history(userId, roleplayId),
    queryFn: () => getAllRoleplaySessions(roleplayId),
    enabled: userId !== null,
  });

  return {
    sessions: data ?? null,
    error: data === undefined ? error : null,
    retry: () => void refetch(),
  };
};
