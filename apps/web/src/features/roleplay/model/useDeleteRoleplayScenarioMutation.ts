// 시나리오 지우기 — 끝나면 목록을 다시 받는다
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { deleteRoleplayScenario } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useDeleteRoleplayScenarioMutation = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoleplayScenario,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: roleplayKeys.scenarios(userId),
      }),
  });
};
