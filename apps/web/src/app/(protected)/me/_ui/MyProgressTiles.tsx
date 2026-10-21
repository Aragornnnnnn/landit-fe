'use client';

// 내 정보 맨 위 타일에 실제 값을 채운다 — 연속 학습은 스트릭에서, 환급은 환급에서 따로 받아 나란히 놓는다
import { rewardBadgeOf } from '@/features/reward/model/reward-status';
import { storedRewardBadgeOf } from '@/features/reward/model/stored-reward';
import { useStreakQuery } from '@/features/streak/model/useStreakQuery';
import { useRewardChallengeLive } from '@/features/subscription/model/paywall-gate/useRewardChallengeLive';

import { useMyReward } from '../../_model/useMyReward';
import { INVITE_BADGE, ProgressTiles } from './ProgressTiles';

// 권할 사람 — 보관 중인 돈이 있으면 그 금액을, 없으면 다 채우면 받는 금액을 말한다
const inviteBadgeOf = (storedWon: number) =>
  storedWon > 0 ? storedRewardBadgeOf(storedWon) : INVITE_BADGE;

// 환급이 열리기 전에는 이 자리가 없다 — 조회도 하지 않아 내 정보는 지금 그대로다
export const MyProgressTiles = () =>
  useRewardChallengeLive() ? <LiveProgressTiles /> : null;

const LiveProgressTiles = () => {
  const { streak, isPending } = useStreakQuery();
  const { reward, invited, settled, storedWon } = useMyReward();

  // 다 알기 전에는 그리지 않는다 — 한 칸으로 떴다가 두 칸으로 갈라지는 것보다 없는 편이 낫다
  if (isPending || !settled) return null;

  const badge = reward && rewardBadgeOf(reward);
  return (
    <ProgressTiles
      rewardBadge={badge ?? (invited ? inviteBadgeOf(storedWon) : null)}
      // 스트릭을 받지 못해도 환급 타일은 보여야 한다 — 헤더의 열매와 같이 0일로 둔다
      streakDays={streak?.currentStreakDays ?? 0}
    />
  );
};
