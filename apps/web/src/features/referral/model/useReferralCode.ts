// 내 초대 코드 — 아직 발급 전이면 그 자리에서 발급받는다. 초대 화면이 보내기 전에 미리 받아 둔다. 같은 사람이 다시 발급받아도 같은 코드가 온다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { issueReferralCode } from '../api/referral';
import { referralKeys } from './keys';
import { useReferralSummaryQuery } from './useReferralSummaryQuery';

export const useReferralCode = () => {
  const userId = useCurrentUserId();
  const summary = useReferralSummaryQuery();
  const issued = useQuery({
    queryKey: referralKeys.code(userId),
    queryFn: issueReferralCode,
    // 조회로 코드가 이미 왔으면 발급을 묻지 않는다
    enabled: userId !== null && summary.isSuccess && summary.data.code === null,
    staleTime: Infinity,
    retry: 1,
  });
  return summary.data?.code ?? issued.data ?? null;
};
