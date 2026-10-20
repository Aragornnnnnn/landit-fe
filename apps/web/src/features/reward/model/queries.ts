// 환급 조회의 키·요청 묶음 — 화면의 조회와 완료·결제 순간의 미리받기가 같은 묶음을 써야 캐시가 하나로 맞는다
import { queryOptions } from '@tanstack/react-query';

import { getMyRewards } from '../api/reward';
import { rewardKeys } from './keys';

export const rewardQueries = {
  summary: (userId: number | null) =>
    queryOptions({
      queryKey: rewardKeys.summary(userId),
      queryFn: getMyRewards,
    }),
};
