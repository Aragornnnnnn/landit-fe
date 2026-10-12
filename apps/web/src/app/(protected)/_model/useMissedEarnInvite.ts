'use client';

// 환급을 권할 사람이 오늘의 시나리오를 끝내고 홈에 돌아온 순간의 연출을 지휘한다 —
// 동전이 알약으로 날아가고(shower), 닿으면 알약이 그 금액을 말하고(claimWon), 처음 한 번은 말풍선이 뜬다(bubble).
// 알약의 금액은 이 방문에서만 남는다. 헤더가 다시 붙으면 평소 글자로 돌아간다
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { clearMissedEarn } from '@/features/reward/model/missed-earn';
import { useMissedEarn } from '@/features/reward/model/useMissedEarn';

import { inviteBubbleSeen } from './invite-bubble-seen';
import { useRewardOffer } from './useRewardOffer';

/**
 * @param invited 환급을 권할 사람인가 — 그 밖의 사람에게는 아무것도 하지 않는다
 */
export const useMissedEarnInvite = (invited: boolean) => {
  const { dailyWon } = useRewardOffer();
  const pending = useMissedEarn() && invited;
  const reduced = useReducedMotion();
  // 동전이 닿은 뒤로 이 방문 동안 알약이 금액을 말한다
  const [claimed, setClaimed] = useState(false);
  const [bubble, setBubble] = useState(false);

  // 알약을 감싼 칸 — 어둠 위에 같은 자리로 알약을 다시 그리려면 화면 자리를 알아야 한다.
  // 자리는 그릴 것이 있을 때만 잰다 — 헤더는 움직이지 않으니 그때의 값이 곧 알약의 자리다
  const [entry, setEntry] = useState<HTMLDivElement | null>(null);
  const pill =
    entry && (pending || bubble) ? entry.getBoundingClientRect() : null;

  // 헤더가 떠나면 표시를 지운다 — 연출 도중 다른 화면으로 가도 다음에 돌아와 다시 틀지 않는다
  useEffect(() => clearMissedEarn, []);

  const land = () => {
    setClaimed(true);
    // 말풍선은 이 기기에서 처음 한 번만
    if (inviteBubbleSeen.has()) return;
    inviteBubbleSeen.mark();
    setBubble(true);
  };

  return {
    // 알약을 감싼 칸에 건다 — 그 칸의 자리가 곧 알약의 자리다
    entryRef: setEntry,
    dailyWon,
    // 알약이 말할 금액. 평소에는 null. 동작 줄이기를 켰으면 연출 없이 바로 금액을 말한다
    claimWon: claimed || (pending && reduced) ? dailyWon : null,
    // 동전 연출을 틀 자리. 틀 것이 없으면 null
    shower: pending && !reduced && pill ? { pill, onLand: land } : null,
    endShower: clearMissedEarn,
    bubble: bubble && pill ? { pill, onClose: () => setBubble(false) } : null,
  };
};
