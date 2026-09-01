// 배울 영어 조회 — 고른 적 없으면 accentLocale이 null로 온다. 게이트가 물을지 말지의 근거다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getMyAccentLocale } from '../api/accent';
import { profileKeys } from './keys';

export const useAccentQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  return useQuery({
    queryKey: profileKeys.accent(userId),
    queryFn: getMyAccentLocale,
    enabled: userId !== null,
    // 조회가 실패해도 화면은 그대로 돌아야 하므로 에러는 밖으로 내보내지 않는다
    retry: 1,
  });
};
