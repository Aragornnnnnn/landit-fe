// 내 초대 코드·조건·등록 상태 조회 — 온보딩은 등록 상태(registrationStatus)로 코드 입력 단계를 넣을지 정한다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getReferralSummary } from '../api/referral';
import { referralKeys } from './keys';

export const useReferralSummaryQuery = () => {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: referralKeys.summary(userId),
    queryFn: getReferralSummary,
    enabled: userId !== null,
    // 실패하면 초대 단계 없이 온보딩이 이어진다 — 화면을 막지 않는다
    retry: 1,
  });
};
