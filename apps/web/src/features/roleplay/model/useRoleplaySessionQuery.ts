// 끝난 롤플레이 대화 한 건 — 주고받은 말과 교정. 교정은 대화가 끝난 뒤 만들어져, 만드는 동안 다시 묻는다
'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { CORRECTION_WAIT_LIMIT_MS } from '@/features/small-talk/model/useSmallTalkSessionQuery';
import { useCurrentUserId } from '@/shared/auth/current-member';

import {
  getRoleplaySession,
  type RoleplayHistoryDetail,
} from '../api/roleplay';
import { roleplayKeys } from './keys';

const POLL_MS = 1_000;

const hasPendingCorrection = (session: RoleplayHistoryDetail | undefined) =>
  session?.messages.some(
    (message) => message.correction?.status === 'PREPARING',
  ) ?? false;

export const useRoleplaySessionQuery = (sessionId: number) => {
  const userId = useCurrentUserId();
  // 상한까지 기다렸는가 — 그만 묻고 찾는 중 표시를 거둔다
  const [waitExpired, setWaitExpired] = useState(false);
  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.session(userId, sessionId),
    queryFn: () => getRoleplaySession(sessionId),
    refetchInterval: (query) =>
      hasPendingCorrection(query.state.data) && !waitExpired ? POLL_MS : false,
  });

  const preparing = hasPendingCorrection(data);
  useEffect(() => {
    if (!preparing) return;
    const limit = setTimeout(
      () => setWaitExpired(true),
      CORRECTION_WAIT_LIMIT_MS,
    );
    return () => clearTimeout(limit);
  }, [preparing]);

  return {
    session: data ?? null,
    error: data === undefined ? error : null,
    waitExpired,
    retry: () => void refetch(),
  };
};
