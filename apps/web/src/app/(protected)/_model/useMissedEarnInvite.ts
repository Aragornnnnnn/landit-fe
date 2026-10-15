'use client';

// 환급을 권할 사람이 오늘의 시나리오를 끝내고 홈에 돌아온 순간의 연출을 지휘한다 —
// 동전이 알약으로 날아가고(shower), 닿으면 알약이 그 금액을 말하고(pillWon), 처음 한 번은 말풍선이 뜬다(bubble).
// 무료로 지난 이틀 이상 해 온 사람에게는 알약이 놓친 금액을, 말풍선이 오늘 몫을 말한다(missed).
// 알약의 금액은 이 방문에서만 남는다. 헤더가 다시 붙으면 평소 글자로 돌아간다
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { clearMissedEarn } from '@/features/reward/model/missed-earn';
import type { MissedReward } from '@/features/reward/model/missed-reward';
import { useMissedEarn } from '@/features/reward/model/useMissedEarn';

import { inviteBubbleSeen } from './invite-bubble-seen';
import { useRewardOffer } from './useRewardOffer';

/**
 * @param invited 환급을 권할 사람인가 — 그 밖의 사람에게는 아무것도 하지 않는다
 * @param missedReward 무료로 지난 이틀 이상 해 온 사람의 놓친 환급액. 아니면 null
 */
export const useMissedEarnInvite = (
  invited: boolean,
  missedReward: MissedReward | null = null,
) => {
  const offer = useRewardOffer({ enabled: invited });
  const pending = useMissedEarn() && invited;
  const reduced = useReducedMotion();
  // 동전이 닿은 순간의 놓친 환급액 — 닿기 전에는 undefined. 이 방문 동안 알약과 말풍선은 이 값을 지킨다.
  // 자정을 넘겨 끝낸 대화처럼 닿은 뒤에 새 값이 와도 알약 글자가 그 자리에서 바뀌지 않게
  const [landed, setLanded] = useState<MissedReward | null>();
  const [bubble, setBubble] = useState(false);
  const [bubbleClosed, setBubbleClosed] = useState(false);
  const shown = landed === undefined ? missedReward : landed;
  // 놓친 사람에게는 환급 화면과 같은 서버 값으로 말한다
  const dailyWon = shown?.dailyWon ?? offer.dailyWon;

  // 알약을 감싼 칸 — 어둠 위에 같은 자리로 알약을 다시 그리려면 화면 자리를 알아야 한다.
  // 자리는 그릴 것이 있을 때만 잰다 — 헤더는 움직이지 않으니 그때의 값이 곧 알약의 자리다
  const [entry, setEntry] = useState<HTMLDivElement | null>(null);
  const pill =
    entry && (pending || bubble) ? entry.getBoundingClientRect() : null;

  // 헤더가 떠나면 표시를 지운다 — 연출 도중 다른 화면으로 가도 다음에 돌아와 다시 틀지 않는다.
  // 붙자마자 떼였다 다시 붙는 경우(개발 모드의 이중 마운트)에는 지우지 않는다 — 그러면 연출이 뜨기도 전에 표시가 사라진다
  useEffect(() => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
    }, 0);
    return () => {
      clearTimeout(timer);
      if (settled) clearMissedEarn();
    };
  }, []);

  const landWon = shown?.missedWon ?? dailyWon;

  const land = () => {
    setLanded(missedReward);
    // 말풍선은 이 기기에서 처음 한 번만 — 놓친 사람에게는 오늘 몫을 권하는 말이라 오늘의 시나리오를 끝낼 때마다 띄운다
    if (!missedReward && inviteBubbleSeen.has()) return;
    inviteBubbleSeen.mark();
    setBubble(true);
  };

  // 동작 줄이기를 켰으면 연출만 건너뛰고 동전이 닿은 것으로 친다 — 놓친 사람에게는 말풍선도 띄운다
  const skipped = pending && reduced;
  const bubbleOpen =
    !bubbleClosed && (bubble || (skipped && missedReward !== null));

  return {
    // 알약을 감싼 칸에 건다 — 그 칸의 자리가 곧 알약의 자리다
    entryRef: setEntry,
    dailyWon,
    // 알약이 말할 금액. 동전이 닿기 전에는 null
    pillWon: landed !== undefined || skipped ? landWon : null,
    // 동전이 닿는 순간 알약이 말할 금액 — 연출 위에 다시 그리는 알약이 닿자마자 쓴다
    landWon,
    // 알약과 말풍선이 놓친 금액 쪽으로 말하는가
    missed: shown !== null,
    // 동전 연출을 틀 자리. 틀 것이 없으면 null
    shower: pending && !reduced && pill ? { pill, onLand: land } : null,
    endShower: clearMissedEarn,
    bubble:
      bubbleOpen && pill
        ? { pill, onClose: () => setBubbleClosed(true) }
        : null,
  };
};
