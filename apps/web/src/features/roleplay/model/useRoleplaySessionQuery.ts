// 끝난 롤플레이 대화 한 건 — 주고받은 말과 교정. 요약을 거쳐 오면 교정은 이미 다 만들어져 있다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplaySession } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useRoleplaySessionQuery = (sessionId: number) => {
  const userId = useCurrentUserId();
  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.session(userId, sessionId),
    queryFn: () => getRoleplaySession(sessionId),
  });

  return {
    session: data ?? null,
    error: data === undefined ? error : null,
    retry: () => void refetch(),
  };
};
