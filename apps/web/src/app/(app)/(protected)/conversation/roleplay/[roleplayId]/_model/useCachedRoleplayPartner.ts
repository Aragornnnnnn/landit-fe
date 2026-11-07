// 세션을 기다리는 동안 세울 상대 — 목록을 새로 받진 않고 홈이 받아 둔 것만 본다
'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { RoleplaySettings } from '@/features/roleplay/api/roleplay';
import { roleplayKeys } from '@/features/roleplay/model/keys';
import { useCurrentUserId } from '@/shared/auth/current-member';

import { findCachedPartner } from './cached-partner';

export const useCachedRoleplayPartner = (roleplayId: number) => {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  // 들어온 순간의 값으로 고정한다 — 기다리는 사이 목록이 다시 와도 무대의 상대가 바뀌지 않게
  const [partner] = useState(() =>
    findCachedPartner(
      queryClient.getQueryData<RoleplaySettings[]>(
        roleplayKeys.scenarios(userId),
      ),
      roleplayId,
    ),
  );
  return partner;
};
