// 시나리오 삭제 — 지우면 카드를 바로 빼고, 실패해도 목록을 다시 받아 서버와 맞춘다
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';
import { useCurrentUserId } from '@/shared/auth/current-member';

import { deleteRoleplay, type RoleplaySettings } from '../api/roleplay';
import { roleplayKeys } from './keys';

// 다른 기기에서 지웠거나 응답만 놓친 경우 — 사용자가 원한 결과와 같다
const deleteIgnoringGone = (roleplayId: number) =>
  deleteRoleplay(roleplayId).catch((cause: unknown) => {
    if (cause instanceof ApiError && cause.status === 404) return;
    throw cause;
  });

export const useDeleteRoleplayScenarioMutation = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const queryKey = roleplayKeys.scenarios(userId);
  return useMutation({
    mutationFn: deleteIgnoringGone,
    onSuccess: (_, roleplayId) => {
      queryClient.setQueryData<RoleplaySettings[]>(queryKey, (scenarios) =>
        scenarios?.filter((scenario) => scenario.id !== roleplayId),
      );
      // 기다리지 않는다 — 다시 받는 동안 이미 지운 시트를 잠가 둘 이유가 없다
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => void queryClient.invalidateQueries({ queryKey }),
  });
};
