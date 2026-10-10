'use client';

// 환급 화면의 히어로 — 돈통 그림과 쌓인 금액, 그 아래 오늘 세 칸
import Link from 'next/link';

import type { RewardView } from '@/features/reward/api/reward';
import {
  rewardHeroOf,
  todaySlotsOf,
} from '@/features/reward/model/reward-status';
import { useMidnightUrgent } from '@/features/reward/model/useMidnightUrgent';
import { CountUpWon } from '@/features/reward/ui/common/CountUpWon';
import { TodayTiles } from '@/features/reward/ui/common/TodayTiles';
import { paywallPath, REFUND_PATH } from '@/shared/lib/routes';

import { potArtOf, potStageOf, type PotStage } from '../_model/pot-stage';
import { MidnightCountdown } from './MidnightCountdown';
import { RefundPot } from './RefundPot';

const GOLD_TINT = 'bg-linear-to-b from-[#ffc850]/25 to-transparent';
// 그림에 맞춰 화면 위쪽에 은은하게 감도는 빛
const TINT: Record<PotStage, string> = {
  empty: '',
  // 어제 쉬어 사라진 날은 화면도 식는다
  lost: 'bg-linear-to-b from-foreground/12 to-transparent',
  // 오늘이 아직이면(낮) 차분한 살구빛 — 경고는 아니지만 평소와는 다르다
  waiting: 'bg-linear-to-b from-primary/8 to-transparent',
  kept: GOLD_TINT,
  complete: GOLD_TINT,
};
// 자정이 가까워지면 붉어진다
const URGENT_TINT = 'bg-linear-to-b from-destructive/10 to-transparent';

export const RefundHero = ({ reward }: { reward: RewardView }) => {
  const { label, amountWon, title, guide } = rewardHeroOf(reward);
  // 오늘 타일은 쌓는 중일 때만 온다 — 끝났거나 확인 중이면 오늘 할 일이 없다
  const slots = todaySlotsOf(reward.today?.activities ?? []);
  const stage = potStageOf(reward);
  // 쌓인 게 있는데 오늘이 아직이고, 자정까지 여섯 시간이 안 남았다
  const urgent = useMidnightUrgent(stage === 'waiting');

  return (
    <section
      className={`flex flex-col items-center px-5 pt-4 ${urgent ? URGENT_TINT : TINT[stage]}`}
    >
      {urgent && <MidnightCountdown />}
      <RefundPot
        art={potArtOf(stage, urgent)}
        // 오늘 다 채운 칸 수만큼 동전이 떨어진다
        drops={slots.filter((slot) => slot.progress === 1).length}
      />

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
      <p
        className={`mt-1.5 text-center whitespace-pre-line ${
          urgent
            ? 'text-[15px] font-black text-destructive'
            : 'text-[14px] font-medium text-muted-foreground'
        }`}
      >
        {guide}
      </p>

      {reward.state === 'ENDED' && (
        <Link
          // 결제하고 돌아오면 이 화면이 다시 열린다 — 기록에 같은 화면이 두 번 쌓이지 않게 갈아 끼운다
          replace
          href={paywallPath({ source: 'refund', from: REFUND_PATH })}
          className="mt-4 text-[14px] font-bold text-primary"
        >
          다시 시작하고 또 환급받기 ›
        </Link>
      )}

      {slots.length > 0 && (
        <div className="mt-5 w-full">
          <TodayTiles slots={slots} />
        </div>
      )}
    </section>
  );
};
