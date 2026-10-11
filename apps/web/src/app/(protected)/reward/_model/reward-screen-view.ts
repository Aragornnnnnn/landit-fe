// 환급 화면이 무엇을 그릴지 한 번에 정한다 — 본문과 아래 버튼, 노출 계측이 같은 판정을 본다
import type { EventProps, RewardViewStatus } from '@landit/analytics';

import type { RewardState, RewardView } from '@/features/reward/api/reward';
import { balanceOf } from '@/features/reward/model/reward-status';

export type RewardScreenView =
  // 참여자 — 쌓인 금액과 내역
  | { kind: 'record'; reward: RewardView }
  // 권할 사람 — 환급 소개
  | { kind: 'intro' }
  | { kind: 'error'; error: Error }
  | { kind: 'loading' }
  // 환급과 상관없는 사람 — 홈으로 보낸다
  | { kind: 'outsider' };

export const rewardScreenViewOf = ({
  reward,
  error,
  loaded,
  fetching,
  invited,
  settled,
}: {
  // 참여자가 아니면 null
  reward: RewardView | null;
  error: Error | null;
  // 환급 응답을 한 번이라도 받았는가
  loaded: boolean;
  // 환급을 다시 받는 중 — 결제 직후처럼 받아 둔 답이 곧 바뀔 수 있다
  fetching: boolean;
  invited: boolean;
  settled: boolean;
}): RewardScreenView => {
  if (reward) return { kind: 'record', reward };
  // 받은 적이 있으면 다시 받기가 실패해도 보던 화면을 지킨다
  if (error && !loaded) return { kind: 'error', error };
  if (invited) return { kind: 'intro' };
  // 다시 받는 중에는 내보내지 않는다 — 방금 결제한 사람을 옛 답으로 홈에 보내면 안 된다
  return { kind: settled && !fetching ? 'outsider' : 'loading' };
};

// 쌓는 중인 사람이 화면에서 본 오늘 — 히어로 아래 문구(todayGuideOf)와 같은 순서로 가른다
const activeStatusOf = (reward: RewardView): RewardViewStatus => {
  if ((reward.today?.earnedWon ?? 0) > 0) return 'kept';
  if ((balanceOf(reward) ?? 0) > 0) return 'at_risk';
  return reward.lostYesterdayWon > 0 ? 'reset' : 'idle';
};

const SETTLED_STATUS: Partial<Record<RewardState, RewardViewStatus>> = {
  ENDED: 'ended',
  PENDING: 'pending',
  REVIEW: 'review',
};

/** 환급 화면 노출에 실을 값. 볼 것이 아직 없으면(받는 중·오류·내보내는 중) null */
export const rewardViewedPropsOf = (
  view: RewardScreenView,
): EventProps['Reward Viewed'] | null => {
  if (view.kind === 'intro') return { status: 'intro' };
  if (view.kind !== 'record') return null;

  const { reward } = view;
  const balance = balanceOf(reward);
  return {
    status: SETTLED_STATUS[reward.state] ?? activeStatusOf(reward),
    // 도는 회차가 없으면(끝남·결제 확인 중) 쌓인 금액이 없다
    ...(balance !== null && { balance_won: balance }),
    // 끝난 사람은 돌려받을 돈이 남았는지에 따라 화면이 갈린다
    ...(reward.state === 'ENDED' && {
      pending_refund_won: reward.pendingRefundWon,
    }),
  };
};
