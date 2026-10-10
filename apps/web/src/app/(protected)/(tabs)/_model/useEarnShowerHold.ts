'use client';

// 홈에 돌아온 순간의 환급 동전 연출이 끝날 때까지 홈의 시트들을 붙잡아 둔다 — 어둠 아래에서 시트가 같이 올라오면 둘이 겹친다
import { useState } from 'react';

import { balanceOf } from '@/features/reward/model/reward-status';
import { usePendingGain } from '@/features/reward/model/useBalanceGain';

import { useMyReward } from '../../_model/useMyReward';

export const useEarnShowerHold = () => {
  const { reward, fetching } = useMyReward();
  const gain = usePendingGain(reward && balanceOf(reward));
  // 참여자의 환급을 다시 받는 중이면 늘어난 금액이 곧 도착할 수 있다 — 시트가 먼저 떴다가 연출에 덮이지 않게 기다린다
  const busy = gain !== null || (reward !== null && fetching);

  // 한 번 풀면 다시 붙잡지 않는다 — 환급은 앱에 돌아올 때마다 다시 받는데, 그때마다 떠 있던 시트가 닫혔다 열리면 안 된다
  const [released, setReleased] = useState(false);
  if (!busy && !released) setReleased(true);

  return !released;
};
