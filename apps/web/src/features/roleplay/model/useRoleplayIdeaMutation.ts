// 아이디어 추천받기 — 누를 때마다 새로 받는다. 캐시할 값이 아니라 뮤테이션으로 둔다
'use client';

import { useMutation } from '@tanstack/react-query';

import { getRoleplayIdea } from '../api/roleplay';

export const useRoleplayIdeaMutation = () =>
  useMutation({
    // 직전에 받은 아이디어는 빼 달라고 한다 — 연달아 눌러도 같은 조합이 다시 오지 않는다
    mutationFn: (excludeId?: number) => getRoleplayIdea(excludeId),
  });
