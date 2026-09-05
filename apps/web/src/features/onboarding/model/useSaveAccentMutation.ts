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
    onMutate: async (accent) => {
      // 진행 중인 조회를 먼저 끊는다 — 늦게 도착한 응답이 방금 고른 값을 덮으면 게이트가 다시 묻는다
      await queryClient.cancelQueries({
        queryKey: profileKeys.accent(userId),
      });
      // name은 서버가 붙여주는 표시용 값이라 여기선 모른다 — 다음 조회에 채워진다
      queryClient.setQueryData(profileKeys.accent(userId), {
        accentLocale: accent,
        name: null,
      });
    },
    onError: (error) => reportWarning(error),
    // 성공이든 실패든 서버 값을 다시 확인한다 — 저장이 실패했다면 조회가 null로 와서 다시 묻게 된다
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: profileKeys.accent(userId) }),
  });
};
