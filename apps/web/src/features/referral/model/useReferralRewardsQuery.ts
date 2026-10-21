// 내가 받은 초대 보상 전부 — 받은 돈 합계를 내야 해서 장을 끝까지 이어 받는다
'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getReferralRewards, type ReferralReward } from '../api/referral';
import { referralKeys } from './keys';

// 장 수 상한 — 이보다 많이 받는 사람은 드물다. 응답이 끝없이 이어져도 화면이 멈추지 않게 묶는다
const MAX_PAGES = 10;

const getAllReferralRewards = async () => {
  const rewards: ReferralReward[] = [];
  let before: number | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { items, hasNext } = await getReferralRewards(before);
    rewards.push(...items);
    if (!hasNext || items.length === 0) break;
    before = items[items.length - 1].id;
  }
  return rewards;
};

export const useReferralRewardsQuery = () => {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: referralKeys.rewards(userId),
    queryFn: getAllReferralRewards,
    enabled: userId !== null,
    retry: 1,
  });
};
