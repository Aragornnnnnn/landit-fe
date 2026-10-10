// 환급이 바뀌는 순간(학습 완료, 결제) 서버에서 미리 받아 둔다 — 다음 화면이 열렸을 때 이미 새 값이어야 한다.
// 버리기만 하면 화면이 다시 붙은 뒤에야 조회가 시작돼, 옛 값을 먼저 그리고 뒤늦게 바뀐다
import type { QueryClient } from '@tanstack/react-query';

import { getCurrentUserId } from '@/shared/auth/auth-store';

import { getMyRewards } from '../api/reward';
import { rewardKeys } from './keys';

export const refreshReward = (queryClient: QueryClient) => {
  const userId = getCurrentUserId();
  if (userId === null) return;

  // 환급을 받아 본 적이 없으면(출시 전이거나 아직 묻지 않았다) 여기서 새로 묻지 않는다
  const key = rewardKeys.summary(userId);
  if (queryClient.getQueryData(key) === undefined) return;

  // 받아 둔 것을 먼저 낡은 것으로 표시해야 아래 미리받기가 실제로 나간다
  void queryClient.invalidateQueries({ queryKey: rewardKeys.all });
  void queryClient.prefetchQuery({ queryKey: key, queryFn: getMyRewards });
};
