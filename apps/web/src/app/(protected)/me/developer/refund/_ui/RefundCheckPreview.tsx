'use client';

// 환급 점검에서 고른 케이스 한 장 — 실제 화면이 쓰는 부품에 가짜 값을 넣어 그린다
import { useState } from 'react';

// 점검은 실제 부품을 그대로 그려야 해서 환급 라우트의 비공개 폴더를 가져온다
import { RefundApplyButton } from '@/app/(protected)/refund/_ui/RefundApplyButton';
import { RefundFrame } from '@/app/(protected)/refund/_ui/RefundFrame';
import { RefundHistoryList } from '@/app/(protected)/refund/_ui/RefundHistoryFeed';
import {
  RefundIntro,
  RefundStartButton,
} from '@/app/(protected)/refund/_ui/RefundIntro';
import { RefundRecord } from '@/app/(protected)/refund/_ui/RefundRecord';
import { RefundSkeleton } from '@/app/(protected)/refund/_ui/RefundSkeleton';
import { useEarnedPop } from '@/features/reward/model/earned-pop';
import { rewardBadgeOf } from '@/features/reward/model/reward-status';
import { rewardReceipt } from '@/features/reward/model/reward.fixture';
import type { BalanceGain } from '@/features/reward/model/seen-balance';
import { HeaderRefund } from '@/features/reward/ui/HeaderRefund';
import { Button } from '@/shared/ui/Button';

import {
  fakeHistoryItems,
  isRecordCase,
  RECORD_CASES,
  type CheckCase,
  type RecordCase,
} from '../_model/refund-check-cases';
import { useFakeHistory } from '../_model/useFakeHistory';

const RecordPreview = ({
  reward,
  history: mode,
  onBack,
}: RecordCase & { onBack: () => void }) => {
  const history = useFakeHistory(fakeHistoryItems(reward), mode);

  return (
    <RefundFrame onBack={onBack} footer={<RefundApplyButton reward={reward} />}>
      <RefundRecord
        reward={reward}
        history={<RefundHistoryList {...history} />}
      />
    </RefundFrame>
  );
};

const COIN_BALANCE_WON = 2015;
const COIN_GAINS = [11, 111, 332];

// 헤더 알약에 동전이 날아드는 연출 — 받은 금액을 골라 다시 돌린다
const CoinPreview = ({ onBack }: { onBack: () => void }) => {
  const [balanceWon, setBalanceWon] = useState(COIN_BALANCE_WON);
  const [gain, setGain] = useState<BalanceGain | null>(null);
  const badge = rewardBadgeOf(RECORD_CASES.partly.reward);

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <header className="flex shrink-0 items-center px-5 pt-[max(var(--safe-area-inset-top),10px)] pb-1">
        {badge && (
          <HeaderRefund
            badge={{ ...badge, amountWon: balanceWon }}
            gain={gain}
            onGainEnd={() => setGain(null)}
          />
        )}
      </header>
      {/* 가운데에 뜨는 큰 동전과 겹치지 않게 위에 붙여 둔다 */}
      <div className="flex flex-col gap-3 px-5 pt-8">
        {COIN_GAINS.map((gainWon) => (
          <Button
            key={gainWon}
            variant="secondary"
            // 도는 연출의 금액이 중간에 바뀌지 않게 한다
            disabled={gain !== null}
            onClick={() => {
              setGain({ fromWon: balanceWon, toWon: balanceWon + gainWon });
              setBalanceWon(balanceWon + gainWon);
            }}
          >
            {gainWon}원 받기
          </Button>
        ))}
        <Button variant="ghost" onClick={onBack}>
          목록으로
        </Button>
      </div>
    </main>
  );
};

// 표현 하나를 끝낼 때 위에서 떨어지는 알림 — 11원 세 번 뒤에 77원이 온다
const POP_AMOUNTS = [11, 11, 11, 77];

const PopPreview = ({ onBack }: { onBack: () => void }) => {
  const show = useEarnedPop((state) => state.show);
  const [count, setCount] = useState(0);

  return (
    <RefundFrame onBack={onBack}>
      <div className="flex h-full flex-col justify-center gap-3 px-5">
        <Button
          onClick={() => {
            // 같은 완료로 보이면 알림이 다시 뜨지 않는다 — 누를 때마다 새 완료로 만든다
            show(
              rewardReceipt({
                activityType: 'EXPRESSION',
                completionId: Date.now(),
                earnedWon: POP_AMOUNTS[count % POP_AMOUNTS.length],
              }),
            );
            setCount(count + 1);
          }}
        >
          표현 하나 끝내기
        </Button>
      </div>
    </RefundFrame>
  );
};

export const RefundCheckPreview = ({
  name,
  onBack,
}: {
  name: CheckCase;
  onBack: () => void;
}) => {
  if (isRecordCase(name))
    return <RecordPreview {...RECORD_CASES[name]} onBack={onBack} />;
  if (name === 'intro')
    return (
      <RefundFrame
        onBack={onBack}
        footer={<RefundStartButton />}
        fadeAboveFooter
      >
        <RefundIntro />
      </RefundFrame>
    );
  if (name === 'coin') return <CoinPreview onBack={onBack} />;
  if (name === 'pop') return <PopPreview onBack={onBack} />;
  // 케이스를 더하고 여기에 갈래를 안 만들면 빌드가 깨진다
  name satisfies 'loading';
  return (
    <RefundFrame onBack={onBack}>
      <RefundSkeleton />
    </RefundFrame>
  );
};
