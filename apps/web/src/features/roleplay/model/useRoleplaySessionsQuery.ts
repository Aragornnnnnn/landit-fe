// 시나리오 하나로 한 지난 대화 — 최신순
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplaySessions } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useRoleplaySessionsQuery = (scenarioId: number) => {
  const userId = useCurrentUserId();

  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.sessions(userId, scenarioId),
    queryFn: () => getRoleplaySessions(scenarioId),
    enabled: userId !== null,
  });

  return {
    sessions: data ?? null,
    // 다시 받기(앱 복귀·삭제 뒤 무효화)가 실패해도 받아 둔 목록은 그대로 보인다 — 에러는 처음 받을 때만
    error: data === undefined ? error : null,
    retry: () => void refetch(),
  };
};
