'use client';

// 헤더 왼쪽의 환급 알약 — 참여자에게는 쌓인 금액을, 아직 시작하지 않은 사람에게는 진입 글자를 놓고, 늘어난 금액이 있으면 동전 연출을 얹는다
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { REFUND_PATH } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';

import { badgeAmountOf, type RewardBadge } from '../model/reward-status';
import type { BalanceGain } from '../model/seen-balance';
import { shortClockLabel } from '../model/time-left';
import { useMidnightLeft } from '../model/useMidnightLeft';
import { useMidnightUrgent } from '../model/useMidnightUrgent';
import { Coin } from './common/Coin';
import { CoinShower } from './common/CoinShower';
import {
  REFUND_PILL_CLASS,
  REFUND_PILL_COIN,
  REFUND_PILL_GOLD,
} from './common/refund-pill';

// 평소에는 금빛, 오늘이 아직이면 회색으로 식고, 걸린 금액이 있는데 자정이 가까우면 빨갛게 남은 시간을 같이 말한다
const TONE = {
  gold: REFUND_PILL_GOLD,
  cool: 'bg-secondary text-muted-foreground',
  urgent: 'bg-destructive text-destructive-foreground',
};

const toneOf = (mood: RewardBadge['mood'], urgent: boolean) => {
  if (urgent) return 'urgent';
  return mood === 'kept' ? 'gold' : 'cool';
};

export const HeaderRefund = ({
  badge,
  gain,
  onGainEnd,
}: {
  badge: RewardBadge;
  // 학습을 끝내고 돌아온 사이 늘어난 금액 — 그만큼 동전이 날아들고 숫자가 오른다. 없으면 null
  gain: BalanceGain | null;
  // 연출이 다 돌았거나 건너뛰었다
  onGainEnd: () => void;
}) => {
  // 걸린 금액이 있을 때만 급해진다 — 쌓인 게 없으면 오늘이 아직이어도 회색에 머문다
  const urgent = useMidnightUrgent(badge.mood === 'atRisk');
  const tone = toneOf(badge.mood, urgent);
  const amount = badgeAmountOf(badge);

  const showering = gain !== null;
  // 어둠 위에 같은 자리로 알약을 다시 그리려면 화면 자리를 알아야 한다 — 붙은 뒤에 잰다
  const pillRef = useRef<HTMLAnchorElement>(null);
  const [pill, setPill] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (showering && pillRef.current)
      setPill(pillRef.current.getBoundingClientRect());
  }, [showering]);

  return (
    <>
      <Link
        ref={pillRef}
        href={REFUND_PATH}
        aria-label={`${badge.label} ${amount}, ${badge.note}, 환급 보기`}
        className={`${REFUND_PILL_CLASS} transition-colors active:scale-95 ${TONE[tone]}`}
      >
        <Coin
          size={REFUND_PILL_COIN}
          // 회색일 때는 동전도 식는다
          className={tone === 'cool' ? 'opacity-50 grayscale' : ''}
        />
        {/* 연출이 도는 동안은 어둠 아래에서 예전 금액으로 기다린다 — 걷히면 새 금액이 서 있다 */}
        <span className="tabular-nums">
          {showering ? formatWon(gain.fromWon) : amount}
        </span>
        {urgent && <HeaderClock />}
      </Link>
      {/* 알약 밖에 둔다 — 안에 두면 어둠을 누른 것이 알약을 누른 것으로 올라가 환급 화면으로 넘어간다 */}
      {showering && pill && (
        <CoinShower
          pill={pill}
          fromWon={gain.fromWon}
          toWon={gain.toWon}
          onEnd={onGainEnd}
        />
      )}
    </>
  );
};

// 0원이 되기까지 남은 시간 — 줄어드는 숫자가 알약 전체를 다시 그리지 않게 따로 둔다
const HeaderClock = () => {
  const left = useMidnightLeft();

  return (
    <span
      aria-hidden
      className="ml-0.5 border-l border-destructive-foreground/40 pl-2 tabular-nums"
    >
      {shortClockLabel(left)}
    </span>
  );
};

// 아직 환급을 시작하지 않은 사람의 진입 글자 — 프리미엄 진입 알약 안에 놓인다
export const RefundInviteLabel = () => (
  <>
    <Coin size={16} />
    <span>환급 챌린지 시작</span>
  </>
);
