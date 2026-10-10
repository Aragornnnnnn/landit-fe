// 환급이 바뀌는 순간(학습 완료, 결제) 서버에서 미리 받아 둔다 — 다음 화면이 열렸을 때 이미 새 값이어야 한다.
// 버리기만 하면 화면이 다시 붙은 뒤에야 조회가 시작돼, 옛 값을 먼저 그리고 뒤늦게 바뀐다
import type { QueryClient } from '@tanstack/react-query';

import { getCurrentUserId } from '@/shared/auth/auth-store';

import { getMyRewards, type RewardView } from '../api/reward';
import { rewardKeys } from './keys';
import { participantOf } from './reward-status';

// 받아 둔 환급. 받아 본 적이 없으면(출시 전이거나 아직 묻지 않았다) undefined
const cachedReward = (queryClient: QueryClient, userId: number) =>
  queryClient.getQueryData<RewardView>(rewardKeys.summary(userId));

const refetch = (queryClient: QueryClient, userId: number) => {
  // 받아 둔 것을 먼저 낡은 것으로 표시해야 아래 미리받기가 실제로 나간다
  void queryClient.invalidateQueries({ queryKey: rewardKeys.all });
  void queryClient.prefetchQuery({
    queryKey: rewardKeys.summary(userId),
    queryFn: getMyRewards,
  });
};

// 결제처럼 참여 여부가 바뀔 수 있는 순간 — 환급과 상관없던 사람도 새로 받는다
export const refreshRewardAfterPurchase = (queryClient: QueryClient) => {
  const userId = getCurrentUserId();
  if (userId === null || cachedReward(queryClient, userId) === undefined)
    return;
  refetch(queryClient, userId);
};

// 학습을 끝낸 순간 — 금액이 쌓이는 건 참여자뿐이라, 환급과 상관없는 사람은 묻지 않는다
export const refreshRewardAfterCompletion = (queryClient: QueryClient) => {
  const userId = getCurrentUserId();
  if (userId === null) return;
  const cached = cachedReward(queryClient, userId);
  if (cached === undefined || participantOf(cached) === null) return;
  refetch(queryClient, userId);
};
