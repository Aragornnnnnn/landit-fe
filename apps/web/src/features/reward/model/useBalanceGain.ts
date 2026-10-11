'use client';

// 학습을 끝내고 돌아온 사이 늘어난 환급액을 알려 주고, 연출이 끝나면 그 금액을 본 것으로 적어 둔다
import { useEffect, useSyncExternalStore } from 'react';
import { useReducedMotion } from 'motion/react';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  balanceGainOf,
  markBalanceSeen,
  readSeenBalance,
  subscribeSeenBalance,
} from './seen-balance';

const useUserId = () => useAuthStore((state) => state.member?.userId ?? null);

/**
 * 아직 연출하지 않은 늘어난 금액 — 헤더가 동전을 날리고, 홈 화면은 그동안 시트를 미룬다.
 * 둘이 같은 값을 같은 순간에 봐야 해서, 헤더가 들고 있지 않고 본 금액에서 그때그때 구한다.
 *
 * @param balanceWon 도는 회차에 쌓인 금액. 없으면 null
 */
export const usePendingGain = (balanceWon: number | null) => {
  const userId = useUserId();
  const seenWon = useSyncExternalStore(
    subscribeSeenBalance,
    () => (userId === null ? null : readSeenBalance(userId)),
    () => null,
  );
  // 동작 줄이기를 켰으면 연출이 없다 — 늘어난 금액도 없는 것으로 친다
  const reduced = useReducedMotion();
  return reduced ? null : balanceGainOf(seenWon, balanceWon);
};

/**
 * @param balanceWon 도는 회차에 쌓인 금액. 없으면 null
 * @param outsider 환급과 상관없는 사람으로 확인됐는가 — 그때만 0원을 본 것으로 적는다
 */
export const useBalanceGain = (
  balanceWon: number | null,
  outsider: boolean,
) => {
  const userId = useUserId();
  const gain = usePendingGain(balanceWon);

  // 환급과 상관없는 사람은 0원을 본 것으로 적어 둔다 — 결제해 참여자가 되면 처음 쌓인 금액도 돌아왔을 때 동전으로 들어온다.
  // 참여자인데 도는 회차가 없을 때(결제 확인 중, 검토 중)는 적지 않는다 — 보관돼 있던 금액이 돌아온 걸 방금 받은 것처럼 보이면 안 된다
  const seenNow = balanceWon ?? (outsider ? 0 : null);
  useEffect(() => {
    // 연출할 것이 남아 있으면 적지 않는다 — 다 보여 준 뒤에 적는다
    if (userId !== null && seenNow !== null && gain === null)
      markBalanceSeen(userId, seenNow);
  }, [userId, seenNow, gain]);

  return {
    gain,
    // 연출이 다 돌았거나 건너뛰었다 — 이제 그 금액을 본 것이다
    endGain: () => {
      if (userId !== null && balanceWon !== null)
        markBalanceSeen(userId, balanceWon);
    },
  };
};
