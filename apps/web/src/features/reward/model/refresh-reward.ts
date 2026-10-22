// 환급이 바뀌는 순간(시나리오 완료, 결제) 서버에서 미리 받아 두거나, 지금 값을 기다려 받는다 — 다음 화면이 열렸을 때 이미 새 값이어야 한다.
// 버리기만 하면 화면이 다시 붙은 뒤에야 조회가 시작돼, 옛 값을 먼저 그리고 뒤늦게 바뀐다
import type { QueryClient } from '@tanstack/react-query';

import { getCurrentUserId } from '@/shared/auth/auth-store';

import type { RewardCompletion, RewardView } from '../api/reward';
import { completionEarnOf } from './completion-earn';
import { REWARD_GC_MS, rewardKeys } from './keys';
import { clearMissedEarn, markMissedEarn } from './missed-earn';
import { rewardQueries } from './queries';
import { participantOf } from './reward-status';

// 받아 둔 환급. 받아 본 적이 없으면(출시 전이거나 아직 묻지 않았다) undefined
const cachedReward = (queryClient: QueryClient, userId: number) =>
  queryClient.getQueryData<RewardView>(rewardKeys.summary(userId));

// 요약은 새로 받고 내역은 버린다
const renewReward = (queryClient: QueryClient, userId: number) => {
  // 내역은 낡은 것으로만 두면 다음에 열 때 받아 둔 장 수만큼 차례로 다시 받고, 그동안 맨 윗줄 잔액이 위의 금액과 어긋난다
  queryClient.removeQueries({ queryKey: rewardKeys.history(userId) });
  queryClient.removeQueries({ queryKey: rewardKeys.previewHistory(userId) });
  // 받아 둔 것을 먼저 낡은 것으로 표시해야 아래 미리받기가 실제로 나간다
  void queryClient.invalidateQueries({
    queryKey: rewardKeys.summary(userId),
  });
  void queryClient.prefetchQuery(rewardQueries.summary(userId));
};

// 결제처럼 참여 여부가 바뀔 수 있는 순간 — 환급과 상관없던 사람도 새로 받는다
export const refreshRewardAfterPurchase = (queryClient: QueryClient) => {
  // 결제했으니 이제 실제로 쌓이는 사람이다 — 대화를 끝낼 때 적어 둔 「받을 수 있었던 몫」이 남아 있으면,
  // 홈에 돌아와 유료 반영 전에 동전 연출과 금액 알약이 잠깐 떴다 사라진다
  clearMissedEarn();
  const userId = getCurrentUserId();
  if (userId === null || cachedReward(queryClient, userId) === undefined)
    return;
  renewReward(queryClient, userId);
};

/**
 * 시나리오 대화를 끝낸 순간 — 금액이 쌓이는 건 참여자와 무료 미리보기뿐이라, 환급과 상관없는 사람은 묻지 않는다.
 *
 * @param todaysFirst 오늘의 시나리오를 처음 끝낸 것인가 — 그 대화만 적립 대상이다
 * @param receipt 완료 응답에 실려 온 적립 영수증
 */
export const refreshRewardAfterCompletion = (
  queryClient: QueryClient,
  {
    todaysFirst,
    receipt,
  }: { todaysFirst: boolean; receipt: RewardCompletion | undefined },
) => {
  const userId = getCurrentUserId();
  if (userId === null) return;
  const cached = cachedReward(queryClient, userId);
  const participant = cached === undefined ? null : participantOf(cached);
  // 축하 화면이 보여 줄 받은 금액을 적는다. 받은 것이 없으면 전에 적어 둔 것을 지운다
  const key = rewardKeys.completionEarn(userId);
  // 보는 화면이 없는 값이라 기본 보관 시간(5분)이면 축하 화면 전에 지워질 수 있다 — 축하는 피드백 화면을 거쳐 간다.
  // 보관 시간은 캐시에 처음 놓일 때 정해지므로 적기 전에 건다
  queryClient.setQueryDefaults(key, { gcTime: REWARD_GC_MS });
  queryClient.setQueryData(key, participant ? completionEarnOf(receipt) : null);
  if (participant === null) {
    // 환급을 받아 본 적이 있고(출시됨) 참여자가 아니면, 이 대화는 챌린지였다면 받았을 몫이다 — 홈이 그걸 한 번 보여 준다.
    // 권할 사람인지(무료·결제 가능)는 보여 주는 쪽이 가린다
    if (cached !== undefined && todaysFirst) markMissedEarn(userId);
    // 무료로 쌓는 사람은 놓친 금액과 오늘 했는지가 이 대화로 바뀐다 — 환급 화면이 옛 값으로 「오늘부터」를 말하지 않게 새로 받는다
    if (cached?.preview && todaysFirst) renewReward(queryClient, userId);
    return;
  }
  renewReward(queryClient, userId);
};

// 결제 직후처럼 지금 값이 꼭 필요한 순간 — 받는 중이면 끝날 때까지 기다린다. 환급과 상관없거나 받지 못하면 null.
// 받아 둔 답이 아직 신선하면 그대로 준다 — 결제 전의 답을 버리려면 refreshRewardAfterPurchase가 먼저 불려 있어야 한다
export const fetchLatestReward = async (
  queryClient: QueryClient,
  // 받아 둔 답이 신선해도 새로 받는다 — 서버 반영이 늦었을지 모를 때
  { fresh = false }: { fresh?: boolean } = {},
) => {
  const userId = getCurrentUserId();
  if (userId === null) return null;
  try {
    return participantOf(
      await queryClient.fetchQuery({
        ...rewardQueries.summary(userId),
        ...(fresh && { staleTime: 0 }),
      }),
    );
  } catch {
    // 환급을 못 받았다고 결제 직후의 흐름을 막지 않는다
    return null;
  }
};
