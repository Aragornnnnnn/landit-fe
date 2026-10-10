'use client';

// 환급 점검에서 고른 케이스 한 장 — 실제 화면이 쓰는 부품에 가짜 값을 넣어 그린다
import { useState } from 'react';

import { RefundApplyButton } from '@/app/(protected)/refund/_ui/RefundApplyButton';
import { RefundHero } from '@/app/(protected)/refund/_ui/RefundHero';
import { RefundHistoryList } from '@/app/(protected)/refund/_ui/RefundHistoryFeed';
import {
  RefundIntro,
  RefundStartButton,
} from '@/app/(protected)/refund/_ui/RefundIntro';
import { RefundRulesToggle } from '@/app/(protected)/refund/_ui/RefundRulesToggle';
import { RefundSkeleton } from '@/app/(protected)/refund/_ui/RefundSkeleton';
import { useEarnedPop } from '@/features/reward/model/earned-pop';
import { rewardBadgeOf } from '@/features/reward/model/reward-status';
import { rewardReceipt } from '@/features/reward/model/reward.fixture';
import type { BalanceGain } from '@/features/reward/model/seen-balance';
import { HeaderRefund } from '@/features/reward/ui/HeaderRefund';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Button } from '@/shared/ui/Button';

import {
  fakeHistoryItems,
  isRecordCase,
  RECORD_CASES,
  type RecordCase,
} from '../_model/refund-check-cases';
import { useFakeHistory } from '../_model/useFakeHistory';

const FOOTER_CLASS =
  'flex-none border-t border-border px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),16px)]';

// 환급 화면과 같은 틀 — 헤더, 스크롤 영역, 아래 버튼
const Frame = ({
  onBack,
  footer,
  children,
}: {
  onBack: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
    <BackHeader title="환급" onBack={onBack} />
    <div className="flex-1 overflow-y-auto">{children}</div>
    {footer && <footer className={FOOTER_CLASS}>{footer}</footer>}
  </main>
);

const RecordPreview = ({
  reward,
  history: mode,
  onBack,
}: RecordCase & { onBack: () => void }) => {
  const [items] = useState(() => fakeHistoryItems(reward));
  const history = useFakeHistory(items, mode);

  return (
    <Frame onBack={onBack} footer={<RefundApplyButton reward={reward} />}>
      <div className="pb-8">
        <RefundHero reward={reward} />
        <RefundRulesToggle />
        <RefundHistoryList {...history} />
      </div>
    </Frame>
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
    <Frame onBack={onBack}>
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
    </Frame>
  );
};

export const RefundCheckPreview = ({
  name,
  onBack,
}: {
  name: string;
  onBack: () => void;
}) => {
  if (isRecordCase(name))
    return <RecordPreview {...RECORD_CASES[name]} onBack={onBack} />;
  if (name === 'intro')
    return (
      <Frame onBack={onBack} footer={<RefundStartButton />}>
        <RefundIntro />
      </Frame>
    );
  if (name === 'coin') return <CoinPreview onBack={onBack} />;
  if (name === 'pop') return <PopPreview onBack={onBack} />;
  // 모르는 케이스는 불러오는 중으로 본다 — 'loading'도 여기로 온다
  return (
    <Frame onBack={onBack}>
      <RefundSkeleton />
    </Frame>
  );
};
