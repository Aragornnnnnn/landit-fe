// 배울 영어 저장 — 고른 값을 캐시에 먼저 심는다. 실패를 되돌리지 않는 이유는 학습 수준 저장과 같다
'use client';

import type { AccentLocale } from '@landit/analytics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';
import { reportWarning } from '@/shared/monitoring/report';

import { updateAccentLocale } from '../api/accent';
import { profileKeys } from './keys';

export const useSaveAccentMutation = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accent: AccentLocale) => updateAccentLocale(accent),
    onMutate: (accent) => {
      // name은 서버가 붙여주는 표시용 값이라 여기선 모른다 — 다음 조회에 채워진다
      queryClient.setQueryData(profileKeys.accent(userId), {
        accentLocale: accent,
        name: null,
      });
    },
    onError: (error) => reportWarning(error),
  });
};
