'use client';

// 헤더 왼쪽의 환급 알약 — 참여자에게는 쌓인 금액을, 아직 시작하지 않은 사람에게는 진입 글자를 놓고, 늘어난 금액이 있으면 동전 연출을 얹는다
import { useEffect, useRef, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { REWARD_PATH } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';

import { badgeAmountOf, type RewardBadge } from '../model/reward-status';
import type { BalanceGain } from '../model/seen-balance';
import { Coin } from './common/Coin';
import { CoinShower } from './common/CoinShower';
import {
  REWARD_PILL_CLASS,
  REWARD_PILL_COIN,
  REWARD_PILL_GOLD,
} from './common/reward-pill';

// 오늘 몫을 받았으면 금빛, 아직이면 회색 — 쉬어도 잃는 게 없어 급한 색은 없다
const TONE: Record<RewardBadge['mood'], string> = {
  kept: REWARD_PILL_GOLD,
  idle: 'bg-secondary text-muted-foreground',
};

export const HeaderReward = ({
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
        href={REWARD_PATH}
        onClick={() => track(EVENTS.REWARD_ENTRY_TAPPED, { source: 'header' })}
        aria-label={`${badge.label} ${amount}, ${badge.note}, 환급 보기`}
        className={`${REWARD_PILL_CLASS} transition-colors active:scale-95 ${TONE[badge.mood]}`}
      >
        <Coin
          size={REWARD_PILL_COIN}
          // 회색일 때는 동전도 식는다
          className={badge.mood === 'idle' ? 'opacity-50 grayscale' : ''}
        />
        {/* 연출이 도는 동안은 어둠 아래에서 예전 금액으로 기다린다 — 걷히면 새 금액이 서 있다 */}
        <span className="tabular-nums">
          {showering ? formatWon(gain.fromWon) : amount}
        </span>
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

// 아직 환급을 시작하지 않은 사람의 진입 글자 — 프리미엄 진입 알약 안에 놓인다.
// 오늘의 시나리오를 끝내고 막 돌아온 사람에게는 그 대화로 받을 수 있는 금액을, 무료로 며칠 해 온 사람에게는 놓친 금액을 말한다
export const RewardInviteLabel = ({
  amountWon = null,
  missed = false,
  storedWon = 0,
}: {
  // 알약이 말할 금액. 평소에는 null
  amountWon?: number | null;
  // 금액이 놓친 환급액인가
  missed?: boolean;
  // 결제 전에 보관 중인 돈(초대 보상 등) — 있으면 받으러 가기·놓쳤어요보다 먼저 말한다. 진짜 들어와 있는 돈이다
  storedWon?: number;
}) => (
  <>
    <Coin size={16} />
    <InviteLabelText
      amountWon={amountWon}
      missed={missed}
      storedWon={storedWon}
    />
  </>
);

const InviteLabelText = ({
  amountWon,
  missed,
  storedWon,
}: {
  amountWon: number | null;
  missed: boolean;
  storedWon: number;
}) => {
  if (storedWon > 0)
    return (
      <>
        <span className="tabular-nums">{formatWon(storedWon)}</span>
        <span className="font-medium">쌓여 있어요</span>
      </>
    );
  if (amountWon === null) return <span>0원 프리미엄 시작하기</span>;
  return (
    <>
      <span className="tabular-nums">{formatWon(amountWon)}</span>
      <span className="font-medium">{missed ? '놓쳤어요' : '받으러 가기'}</span>
    </>
  );
};
