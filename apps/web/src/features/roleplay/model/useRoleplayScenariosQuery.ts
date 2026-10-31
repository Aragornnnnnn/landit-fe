// 내 시나리오 목록 — 최근에 만든 순서로 온다. 한 장이 최대 50개라 다음 장이 있으면 끝까지 받아 이어 붙인다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplays, type RoleplaySettings } from '../api/roleplay';
import { roleplayKeys } from './keys';

// 홈 그리드는 개수까지 한 번에 보여 줘서 더 보기 없이 전부 받는다
const getAllRoleplays = async () => {
  const items: RoleplaySettings[] = [];
  for (let page = 0; ; page++) {
    const received = await getRoleplays(page);
    items.push(...received.items);
    if (!received.hasNext) return items;
  }
};

export const useRoleplayScenariosQuery = () => {
  const userId = useCurrentUserId();
  const { data, error, refetch } = useQuery({
    queryKey: roleplayKeys.scenarios(userId),
    queryFn: getAllRoleplays,
    enabled: userId !== null,
  });

  return {
    scenarios: data ?? null,
    // 다시 받기(앱 복귀·만든 뒤 무효화)가 실패해도 받아 둔 목록은 그대로 보인다 — 에러는 처음 받을 때만
    error: data === undefined ? error : null,
    retry: () => void refetch(),
  };
};
