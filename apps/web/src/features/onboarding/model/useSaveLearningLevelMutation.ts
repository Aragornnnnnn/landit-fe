// 학습 수준 저장 — 고른 값을 캐시에 먼저 심어 화면이 응답을 기다리지 않게 한다.
// 실패해도 되돌리지 않는다 — 되돌리면 방금 답한 사람을 뒤로 끌어당긴다.
// 서버에 안 실린 값은 다음 방문에 조회가 null로 와서 다시 묻게 되므로 스스로 바로잡힌다
'use client';

import type { EnglishLevel } from '@landit/analytics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';
import { reportWarning } from '@/shared/monitoring/report';

import { updateLearningLevel } from '../api/learning-level';
import { profileKeys } from './keys';

export const useSaveLearningLevelMutation = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (level: EnglishLevel) => updateLearningLevel(level),
    onMutate: (level) => {
      queryClient.setQueryData(profileKeys.learningLevel(userId), {
        learningLevel: level,
      });
    },
    onError: (error) => reportWarning(error),
  });
};
