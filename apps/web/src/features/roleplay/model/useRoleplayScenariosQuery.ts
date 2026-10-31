// 내 시나리오 목록 — 마지막 대화가 최근인 순서로 온다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplayScenarios } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useRoleplayScenariosQuery = () => {
  const userId = useCurrentUserId();

  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.scenarios(userId),
    queryFn: getRoleplayScenarios,
    enabled: userId !== null,
  });

  return {
    scenarios: data ?? null,
    // 다시 받기(앱 복귀·삭제 뒤 무효화)가 실패해도 받아 둔 목록은 그대로 보인다 — 에러는 처음 받을 때만
    error: data === undefined ? error : null,
    retry: () => void refetch(),
  };
};
