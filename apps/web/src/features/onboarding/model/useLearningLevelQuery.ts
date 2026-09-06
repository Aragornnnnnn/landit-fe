// 학습 수준 조회 — 답한 적 없으면 learningLevel이 null로 온다. 게이트가 물을지 말지의 근거다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getMyLearningLevel } from '../api/learning-level';
import { profileKeys } from './keys';

export const useLearningLevelQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  return useQuery({
    queryKey: profileKeys.learningLevel(userId),
    queryFn: getMyLearningLevel,
    enabled: userId !== null,
    // 조회가 실패해도 화면은 그대로 돌아야 하므로 에러는 밖으로 내보내지 않는다
    retry: 1,
  });
};
