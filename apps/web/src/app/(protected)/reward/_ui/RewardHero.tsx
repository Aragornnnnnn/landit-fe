'use client';

// 환급 화면의 히어로 — 돈통 그림과 쌓인 금액, 그 아래 한 줄로 오늘 몫을 받았는지 아직인지 말한다
import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import type { RewardView } from '@/features/reward/api/reward';
import { rewardHeroOf } from '@/features/reward/model/reward-status';
import { useMidnightUrgent } from '@/features/reward/model/useMidnightUrgent';
import { CountUpWon } from '@/features/reward/ui/common/CountUpWon';
import { track } from '@/shared/analytics';
import { paywallPath, REWARD_PATH } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';
import { ChevronRightIcon } from '@/shared/ui/Icons';

import { potStageOf } from '../_model/pot-stage';
import { MidnightCountdown } from './MidnightCountdown';
import { RewardPot } from './RewardPot';

export const RewardHero = ({ reward }: { reward: RewardView }) => {
  const { label, amountWon, title, guide } = rewardHeroOf(reward);
  const earnedToday = (reward.today?.earnedWon ?? 0) > 0;
  // 오늘 받을 몫 — 쌓는 중인데 오늘의 시나리오가 아직일 때만 걸려 있다
  const todayLeftWon =
    reward.state === 'ACTIVE' && !earnedToday
      ? (reward.today?.maximumWon ?? reward.todayMaximumWon)
      : 0;
  const urgent = useMidnightUrgent(todayLeftWon > 0);
  const stage = potStageOf(reward, { urgent });

  return (
    <section className="flex flex-col items-center px-5 pt-4">
      {urgent && <MidnightCountdown amountWon={todayLeftWon} />}
      <RewardPot stage={stage} dropsCoin={earnedToday} />

      {label && (
        <p className="mt-2 text-[13px] font-bold text-primary">{label}</p>
      )}
      <h2
        className={`leading-tight font-black text-foreground ${
          amountWon === null ? 'mt-2 text-[24px]' : 'mt-0.5 text-[36px]'
        }`}
      >
        {amountWon === null ? (
          title
        ) : (
          <CountUpWon
            // 오늘 받은 만큼이 방금 더해진 것처럼 오른다 — 오늘이 없으면 움직이지 않는다
            from={amountWon - (reward.today?.earnedWon ?? 0)}
            to={amountWon}
          />
        )}
      </h2>
      <p className="mt-1.5 text-center text-[14px] font-medium whitespace-pre-line text-muted-foreground">
        {guide}
      </p>

      {reward.state === 'ENDED' && reward.purchaseAvailable && (
        <Link
          // 결제하고 돌아오면 이 화면이 다시 열린다 — 기록에 같은 화면이 두 번 쌓이지 않게 갈아 끼운다
          replace
          href={paywallPath({ source: 'reward', from: REWARD_PATH })}
          onClick={() =>
            track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'reward' })
          }
          className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-[#ffc850]/60 bg-card px-4 py-3.5 text-left transition-transform active:scale-[0.98]"
        >
          <Emoji className="size-7 shrink-0">💰</Emoji>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold text-foreground">
              100일 챌린지 다시 시작하기
            </span>
            <span className="mt-0.5 block text-[13px] font-medium break-keep text-muted-foreground">
              대화할 때마다 환급액이 다시 쌓여요
            </span>
          </span>
          <ChevronRightIcon
            size={20}
            className="shrink-0 text-muted-foreground"
          />
        </Link>
      )}
    </section>
  );
};
