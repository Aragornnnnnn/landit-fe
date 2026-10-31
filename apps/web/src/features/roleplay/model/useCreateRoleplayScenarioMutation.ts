// 시나리오 만들기 — 끝나면 목록을 다시 받아 홈에 새 카드가 서게 한다
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { createRoleplayScenario } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useCreateRoleplayScenarioMutation = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoleplayScenario,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: roleplayKeys.scenarios(userId),
      }),
  });
};
