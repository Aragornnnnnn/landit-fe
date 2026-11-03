// 내 시나리오 목록 — 마지막 대화 순으로 온다. 홈 그리드가 개수까지 보여 줘서 끝까지 받는다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplays } from '../api/roleplay';
import { fetchAllPages } from './fetch-all-pages';
import { roleplayKeys } from './keys';

export const useRoleplayScenariosQuery = () => {
  const userId = useCurrentUserId();
  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.scenarios(userId),
    queryFn: () => fetchAllPages((page) => getRoleplays(page)),
    enabled: userId !== null,
  });

  return {
    scenarios: data ?? null,
    // 다시 받기(앱 복귀·만든 뒤 무효화)가 실패해도 받아 둔 목록은 그대로 보인다 — 에러는 처음 받을 때만
    error: data === undefined ? error : null,
    retry: () => void refetch(),
  };
};
