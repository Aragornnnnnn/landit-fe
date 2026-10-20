'use client';

// 환급 점검에서 고른 케이스 한 장 — 실제 화면이 쓰는 부품에 가짜 값을 넣어 그린다
import { useState } from 'react';

import { glowOf, potStageOf } from '@/app/(protected)/reward/_model/pot-stage';
import { rewardIntroCopyOf } from '@/app/(protected)/reward/_model/reward-intro-copy';
// 점검은 실제 부품을 그대로 그려야 해서 환급 라우트의 비공개 폴더를 가져온다
import { MissedRewardView } from '@/app/(protected)/reward/_ui/MissedRewardIntro';
import { RefundApplyButton } from '@/app/(protected)/reward/_ui/RefundApplyButton';
import { RewardFrame } from '@/app/(protected)/reward/_ui/RewardFrame';
import { RewardHistoryList } from '@/app/(protected)/reward/_ui/RewardHistoryFeed';
import {
  RewardIntro,
  RewardStartButton,
} from '@/app/(protected)/reward/_ui/RewardIntro';
import { RewardRecord } from '@/app/(protected)/reward/_ui/RewardRecord';
import { RewardRulesButton } from '@/app/(protected)/reward/_ui/RewardRulesButton';
import { RewardSkeleton } from '@/app/(protected)/reward/_ui/RewardSkeleton';
import { TITLE_CLASS } from '@/features/expression/ui/ExpressionStages';
import { completionEarnOf } from '@/features/reward/model/completion-earn';
import type {
  MissedReward,
  MissedRow,
} from '@/features/reward/model/missed-reward';
import { rewardOfferOf } from '@/features/reward/model/refund-offer';
import { rewardBadgeOf } from '@/features/reward/model/reward-status';
import type { BalanceGain } from '@/features/reward/model/seen-balance';
import type { RewardHistoryState } from '@/features/reward/model/useRewardHistoryQuery';
import { EarnedStamp } from '@/features/reward/ui/EarnedStamp';
import { HeaderReward } from '@/features/reward/ui/HeaderReward';
import { PASS_FALLBACK_PRICE } from '@/features/subscription/model/product/offering';
import { Button } from '@/shared/ui/Button';

import {
  EARNED_REWARD,
  fakeHistoryItems,
  isRecordCase,
  RECORD_CASES,
  type CheckCase,
  type RecordCase,
} from '../_model/reward-check-cases';
import { useFakeHistory } from '../_model/useFakeHistory';

// 소개 화면의 견본 금액 — 노출하는 5만 원 이용권
const PREVIEW_OFFER = rewardOfferOf(PASS_FALLBACK_PRICE);

// 대화 3일째부터 보는 놓친 금액 — 지난 32일을 무료로 대화했고, 오늘 했는지만 갈린다
const MISSED_DAYS = 32;
const missedOf = (talkedToday: boolean): MissedReward => ({
  pastDays: MISSED_DAYS,
  missedWon: PREVIEW_OFFER.dailyWon * MISSED_DAYS,
  dailyWon: PREVIEW_OFFER.dailyWon,
  talkedToday,
  today: '2026-10-20',
});

// 놓친 금액 아래 기록 — 서버 대신 오늘과 지난 사흘을 한 장으로 준다
const missedHistoryOf = (
  missed: MissedReward,
): RewardHistoryState<MissedRow> => ({
  rows: ['10.20', '10.19', '10.18', '10.17'].map((dateLabel, index) => ({
    id: dateLabel,
    dateLabel,
    amountWon: missed.dailyWon,
    isToday: index === 0,
  })),
  error: null,
  retry: () => {},
  hasMore: false,
  fetching: false,
  loadingMore: false,
  moreFailed: false,
  loadMore: () => {},
});

const RecordPreview = ({
  reward,
  history: mode,
  onBack,
}: RecordCase & { onBack: () => void }) => {
  const history = useFakeHistory(fakeHistoryItems(reward), mode);

  return (
    <RewardFrame
      onBack={onBack}
      glow={glowOf(potStageOf(reward))}
      footer={<RefundApplyButton reward={reward} />}
    >
      <RewardRecord
        reward={reward}
        history={<RewardHistoryList {...history} />}
      />
    </RewardFrame>
  );
};

const COIN_BALANCE_WON = 21000;
// 하루 몫 — 오늘의 시나리오 하나로 받는 금액
const COIN_GAIN_WON = 500;

// 헤더 알약에 동전이 날아드는 연출 — 버튼을 누를 때마다 다시 돌린다
const CoinPreview = ({ onBack }: { onBack: () => void }) => {
  const [balanceWon, setBalanceWon] = useState(COIN_BALANCE_WON);
  const [gain, setGain] = useState<BalanceGain | null>(null);
  const badge = rewardBadgeOf(RECORD_CASES.kept.reward);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header className="flex shrink-0 items-center px-5 pt-[max(var(--safe-area-inset-top),10px)] pb-1">
        {badge && (
          <HeaderReward
            badge={{ ...badge, amountWon: balanceWon }}
            gain={gain}
            onGainEnd={() => setGain(null)}
          />
        )}
      </header>
      {/* 가운데에 뜨는 큰 동전과 겹치지 않게 위에 붙여 둔다 */}
      <div className="flex flex-col gap-3 px-5 pt-8">
        <Button
          variant="secondary"
          // 도는 연출의 금액이 중간에 바뀌지 않게 한다
          disabled={gain !== null}
          onClick={() => {
            setGain({ fromWon: balanceWon, toWon: balanceWon + COIN_GAIN_WON });
            setBalanceWon(balanceWon + COIN_GAIN_WON);
          }}
        >
          {COIN_GAIN_WON}원 받기
        </Button>
        <Button variant="ghost" onClick={onBack}>
          목록으로
        </Button>
      </div>
    </main>
  );
};

// 시나리오를 끝낸 순간의 축하 — 제목 아래 가운데만 실제 부품이다
const EarnedPreview = ({ onBack }: { onBack: () => void }) => {
  const earn = completionEarnOf(EARNED_REWARD, {
    date: EARNED_REWARD.today?.date ?? '',
  });

  return (
    <RewardFrame onBack={onBack}>
      <div className="flex h-full flex-col px-6 pb-6">
        <h1 className={TITLE_CLASS}>{'대화 하나를\n잘 완료했어요!'}</h1>
        {earn && <EarnedStamp earn={earn} />}
      </div>
    </RewardFrame>
  );
};

export const RewardCheckPreview = ({
  name,
  onBack,
}: {
  name: CheckCase;
  onBack: () => void;
}) => {
  if (isRecordCase(name))
    return <RecordPreview {...RECORD_CASES[name]} onBack={onBack} />;
  if (name === 'intro' || name === 'introTalked') {
    const copy = rewardIntroCopyOf(PREVIEW_OFFER, name === 'introTalked');
    return (
      <RewardFrame
        onBack={onBack}
        trailing={<RewardRulesButton dailyWon={PREVIEW_OFFER.dailyWon} />}
        footer={<RewardStartButton label={copy.cta} note={copy.priceNote} />}
        fadeAboveFooter
      >
        <RewardIntro copy={copy} offer={PREVIEW_OFFER} />
      </RewardFrame>
    );
  }
  if (name === 'missed' || name === 'missedTalked') {
    const missed = missedOf(name === 'missedTalked');
    const copy = rewardIntroCopyOf(PREVIEW_OFFER, missed.talkedToday);
    return (
      <RewardFrame
        onBack={onBack}
        trailing={<RewardRulesButton dailyWon={PREVIEW_OFFER.dailyWon} />}
        footer={<RewardStartButton label={copy.cta} note={copy.priceNote} />}
        fadeAboveFooter
        glow="missed"
      >
        <MissedRewardView missed={missed} history={missedHistoryOf(missed)} />
      </RewardFrame>
    );
  }
  if (name === 'coin') return <CoinPreview onBack={onBack} />;
  if (name === 'earned') return <EarnedPreview onBack={onBack} />;
  // 케이스를 더하고 여기에 갈래를 안 만들면 빌드가 깨진다
  name satisfies 'loading';
  return (
    <RewardFrame onBack={onBack}>
      <RewardSkeleton />
    </RewardFrame>
  );
};
