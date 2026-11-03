// 새 시나리오의 세션을 만들기 화면에서 미리 열어 대화 화면에 넘긴다 — 첫 발화까지 기다렸다가 완성 연출 뒤 바로 대화하게 한다
'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import {
  startSavedRoleplaySession,
  type RoleplaySessionStartResponse,
} from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useRoleplaySessionHandoff = () => {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return {
    // 세션을 연다. 그사이 화면을 떠났으면 넘기지 않는다 — 다음 진입이 낡은 세션을 쓰지 않게
    prepare: async (roleplayId: number, stillWanted: () => boolean) => {
      const session = await startSavedRoleplaySession(roleplayId);
      if (!stillWanted()) return;
      queryClient.setQueryData(
        roleplayKeys.handoff(userId, roleplayId),
        session,
      );
    },
    peek: (roleplayId: number) =>
      queryClient.getQueryData<RoleplaySessionStartResponse>(
        roleplayKeys.handoff(userId, roleplayId),
      ) ?? null,
    clear: (roleplayId: number) =>
      queryClient.removeQueries({
        queryKey: roleplayKeys.handoff(userId, roleplayId),
      }),
  };
};
