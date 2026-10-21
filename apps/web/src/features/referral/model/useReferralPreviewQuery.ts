// 넣은 코드가 유효한지와 지금 보상 조건 조회 — 8자리가 다 찼을 때만 묻는다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { previewReferralCode } from '../api/referral';
import { referralKeys } from './keys';
import { REFERRAL_CODE_LENGTH } from './referral-code';

export const useReferralPreviewQuery = (code: string) => {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: referralKeys.preview(userId, code),
    queryFn: () => previewReferralCode(code),
    enabled: userId !== null && code.length === REFERRAL_CODE_LENGTH,
    // 잘못된 코드는 다시 물어도 같다. 조회는 IP당 분당 횟수 제한이 있어 아낀다
    retry: false,
    staleTime: Infinity,
  });
};
