// 초대 코드 건너뛰기 — 기다리지 않고 다음 단계로 가니 요약에 먼저 적는다. 실패해도 온보딩은 막지 않는다(다음 온보딩에서 한 번 더 물을 뿐이다)
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';
import { reportWarning } from '@/shared/monitoring/report';

import { skipReferralRegistration } from '../api/referral';
import { markRegistrationStatus } from './keys';

export const useSkipReferralMutation = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => skipReferralRegistration(),
    onMutate: () => markRegistrationStatus(queryClient, userId, 'SKIPPED'),
    onError: (error) => reportWarning(error),
  });
};
