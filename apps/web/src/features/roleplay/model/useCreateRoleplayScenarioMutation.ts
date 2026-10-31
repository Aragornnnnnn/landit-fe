// 시나리오 만들기(보관함 저장) — 끝나면 목록을 다시 받아 홈에 새 카드가 서게 한다
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { saveRoleplay } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useCreateRoleplayScenarioMutation = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRoleplay,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: roleplayKeys.scenarios(userId),
      }),
  });
};
