// 환급 상태를 앰플리튜드 유저 속성으로 접는다 — 참여한 적 없으면 none, 있으면 서버가 준 국면 그대로
import type { RewardProfileState, UserPropertyPatch } from '@landit/analytics';

import type { RewardState, RewardView } from '../api/reward';

const PROFILE_STATE: Record<RewardState, RewardProfileState> = {
  ACTIVE: 'active',
  ENDED: 'ended',
  PENDING: 'pending',
  REVIEW: 'review',
  NONE: 'none',
};

/** @param reward 참여자가 아니면 null (useRewardQuery가 이미 걸러 준 값) */
export const toRewardProperties = (
  reward: RewardView | null,
): UserPropertyPatch => ({
  reward_state: reward ? PROFILE_STATE[reward.state] : 'none',
});
