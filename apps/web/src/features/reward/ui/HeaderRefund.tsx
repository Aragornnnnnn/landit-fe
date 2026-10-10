'use client';

// 헤더 왼쪽의 환급 알약 — 참여자에게는 쌓인 금액을, 아직 시작하지 않은 사람에게는 진입 글자를 놓는다
import Image from 'next/image';
import Link from 'next/link';

import { REFUND_PATH } from '@/shared/lib/routes';

import coinImage from '../assets/coin.png';
import { badgeAmountOf, type RewardBadge } from '../model/reward-status';
import { shortClockLabel } from '../model/time-left';
import { useMidnightLeft } from '../model/useMidnightLeft';
import { useMidnightUrgent } from '../model/useMidnightUrgent';

// 평소에는 금빛, 오늘이 아직이면 회색으로 식고, 걸린 금액이 있는데 자정이 가까우면 빨갛게 남은 시간을 같이 말한다
const TONE = {
  gold: 'animate-gold-flow text-[#4a2f00]',
  cool: 'bg-secondary text-muted-foreground',
  urgent: 'bg-destructive text-destructive-foreground',
};

const toneOf = (mood: RewardBadge['mood'], urgent: boolean) => {
  if (urgent) return 'urgent';
  return mood === 'kept' ? 'gold' : 'cool';
};

export const HeaderRefund = ({ badge }: { badge: RewardBadge }) => {
  // 걸린 금액이 있을 때만 급해진다 — 쌓인 게 없으면 오늘이 아직이어도 회색에 머문다
  const urgent = useMidnightUrgent(badge.mood === 'atRisk');
  const tone = toneOf(badge.mood, urgent);
  const amount = badgeAmountOf(badge);

  return (
    <Link
      href={REFUND_PATH}
      aria-label={`${badge.label} ${amount}, ${badge.note}, 환급 보기`}
      // 곡률과 세로 여백을 프리미엄 진입 알약(PremiumHeaderEntry의 PILL_CLASS)과 맞춘다 — 한쪽을 바꾸면 같이 본다
      className={`flex items-center gap-1.5 rounded-[10px] py-1.5 pr-3 pl-2 text-[15px] leading-[1.2] font-black transition-colors active:scale-95 ${TONE[tone]}`}
    >
      <Image
        src={coinImage}
        alt=""
        width={20}
        height={20}
        // 회색일 때는 동전도 식는다
        className={tone === 'cool' ? 'opacity-50 grayscale' : ''}
      />
      <span className="tabular-nums">{amount}</span>
      {urgent && <HeaderClock />}
    </Link>
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
    <Image src={coinImage} alt="" width={16} height={16} />
    <span className="tracking-[0.1em]">PREMIUM</span>
    <span>환급받기</span>
  </>
);
