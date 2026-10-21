// 초대 코드 등록 — 끝나면(성공이든, 이미 등록됐든, 등록할 수 없게 됐든) 요약에 바로 적어 코드 단계가 다시 열리지 않게 한다
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { registerReferralCode } from '../api/referral';
import { markRegistrationStatus } from './keys';
import { referralFailureOf } from './referral-failure';

export const useRegisterReferralCodeMutation = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { code: string; policyVersion: number }) =>
      registerReferralCode(body),
    onSuccess: () => markRegistrationStatus(queryClient, userId, 'REGISTERED'),
    onError: (error) => {
      const failure = referralFailureOf(error);
      if (failure.kind !== 'move_on') return;
      // 이미 등록됐으면 등록됨, 등록할 수 없게 됐으면 대상 아님으로 — 둘 다 다시 물을 일이 없다
      markRegistrationStatus(
        queryClient,
        userId,
        failure.notice === null ? 'REGISTERED' : 'UNAVAILABLE',
      );
    },
  });
};
