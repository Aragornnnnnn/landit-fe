// 내가 초대한 사람으로 받은 최근 지급 — 화면은 최근 몇 건과 「모두 보기」만 쓰고, 합계는 요약(inviterCreditedWon)이 준다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getReferralRewards } from '../api/referral';
import { referralKeys } from './keys';

export const useReferralRewardsQuery = () => {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: referralKeys.rewards(userId),
    // 한 장(20건)이면 충분하다 — 상한 인원만큼 쌓이고, 합계를 내려고 끝까지 이어 받을 필요가 없어졌다
    queryFn: async () =>
      (await getReferralRewards({ recipientRole: 'INVITER' })).items,
    enabled: userId !== null,
    retry: 1,
  });
};
