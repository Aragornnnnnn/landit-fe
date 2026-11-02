// 시나리오 삭제 — 끝나면 목록을 다시 받아 홈에서 카드가 빠지게 한다
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { deleteRoleplay } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useDeleteRoleplayScenarioMutation = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoleplay,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: roleplayKeys.scenarios(userId),
      }),
  });
};
