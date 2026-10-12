'use client';

// 환급을 아직 시작하지 않은 사람이 보는 환급 화면 — 무엇을 하면 얼마를 돌려받는지 보여 주고 페이월로 보낸다. 규칙은 헤더의 안내 버튼이 연다.
// 오늘의 시나리오를 이미 했는지에 따라 글자가 갈린다 (reward-intro-copy)
import { EVENTS } from '@landit/analytics';
import { motion, useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';

import { dateLabelAhead } from '@/features/reward/model/reward-history';
import { useMidnightUrgent } from '@/features/reward/model/useMidnightUrgent';
import { CountUpWon } from '@/features/reward/ui/common/CountUpWon';
import { RewardGuide } from '@/features/reward/ui/RewardGuide';
import { RewardHistory } from '@/features/reward/ui/RewardHistory';
import { track } from '@/shared/analytics';
import { paywallPath, REWARD_PATH } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button';

import type { RewardIntroCopy } from '../_model/reward-intro-copy';
import { MidnightCountdown } from './MidnightCountdown';
import { RewardPot } from './RewardPot';

export const RewardIntro = ({
  copy,
  dailyWon,
  talkedToday,
}: {
  copy: RewardIntroCopy;
  dailyWon: number;
  // 오늘의 시나리오를 이미 끝냈는가
  talkedToday: boolean;
}) => (
  <div className="pb-8">
    {talkedToday ? (
      <EarnedToday copy={copy} dailyWon={dailyWon} />
    ) : (
      <RewardGuide
        eyebrow={copy.eyebrow}
        amount={copy.amount}
        caption={copy.caption}
        dailyWon={dailyWon}
        rulesInHeader
      />
    )}
  </div>
);

// 내역 한 줄은 금액이 다 오른 뒤에 올라온다
const ROW_DELAY = 1.2;

// 오늘의 시나리오를 이미 끝낸 사람 — 홈에서 본 동전이 여기 돈통에 떨어지고, 금액이 오르고, 내역 한 줄이 찍힌다.
// 챌린지를 시작하면 이 화면이 그대로 환급 화면의 첫날이 된다
const EarnedToday = ({
  copy,
  dailyWon,
}: {
  copy: RewardIntroCopy;
  dailyWon: number;
}) => {
  const reduced = useReducedMotion();
  // 오늘 끝낸 대화는 오늘 시작해야 인정된다 — 자정이 가까우면 시계로 알린다
  const urgent = useMidnightUrgent(true);

  return (
    <>
      <section className="flex flex-col items-center bg-linear-to-b from-[#ffc850]/25 to-transparent px-5 pt-4">
        {urgent && <MidnightCountdown amountWon={dailyWon} />}
        <RewardPot stage="kept" dropsCoin />
        <p className="mt-2 text-[13px] font-bold text-primary">
          {copy.eyebrow}
        </p>
        <h2 className="mt-0.5 text-[36px] leading-tight font-black text-foreground">
          {/* 동전이 통에 닿는 때에 맞춰 오른다 */}
          <CountUpWon from={0} to={dailyWon} delay={0.8} />
        </h2>
        <p className="mt-1.5 text-center text-[14px] font-medium text-muted-foreground">
          {copy.caption}
        </p>
      </section>

      <motion.div
        className="mt-4 px-5"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: ROW_DELAY, duration: 0.32 }}
      >
        <RewardHistory
          history={[
            {
              id: 'today',
              dateLabel: dateLabelAhead(0),
              title: '시나리오 대화 완료',
              note: '챌린지를 시작하면 받아요',
              amountWon: dailyWon,
              balanceWon: dailyWon,
            },
          ]}
        />
      </motion.div>
    </>
  );
};

// 아래 고정 버튼 — 환급을 시작하려면 결제부터다
export const RewardStartButton = ({ label }: { label: string }) => {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'reward' });
        // 결제하고 돌아오면 이 화면이 다시 열린다 — 기록에 같은 화면이 두 번 쌓이지 않게 갈아 끼운다
        router.replace(paywallPath({ source: 'reward', from: REWARD_PATH }));
      }}
    >
      {label}
    </Button>
  );
};
