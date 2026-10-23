'use client';

// 환급을 아직 시작하지 않은 사람이 보는 환급 화면 — 프리미엄이면 결제한 금액을 돌려받는다는 걸 동전 연출로 보여 주고 페이월로 보낸다.
// 위는 「사실상 0원」 제목과 동전 탑·입금 알림 연출, 아래는 결제하면 보게 될 실제 내역 모습 그대로다
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type { RewardOffer } from '@/features/reward/model/refund-offer';
import { RefundDepositDemo } from '@/features/reward/ui/RefundDepositDemo';
import { SAMPLE_DAYS, sampleHistoryOf } from '@/features/reward/ui/RewardGuide';
import { RewardHistory } from '@/features/reward/ui/RewardHistory';
import { track } from '@/shared/analytics';
import { paywallPath, REWARD_PATH } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';
import { Button } from '@/shared/ui/Button';

import type { RewardIntroCopy } from '../_model/reward-intro-copy';
import { EmphasizedText } from './EmphasizedText';

export const RewardIntro = ({
  copy,
  offer,
  stored,
}: {
  copy: RewardIntroCopy;
  offer: RewardOffer;
  // 결제 전에 이미 쌓인 돈(초대 보상 등)과 그 실제 내역 — 있으면 아래 보기 내역 대신 진짜 내역을 보여 준다
  stored?: { won: number; history: React.ReactNode };
}) => (
  <div className="pb-8">
    <section className="px-5 pt-3 text-center">
      <h2 className="text-26 leading-9 font-black tracking-[-0.025em] text-foreground">
        <EmphasizedText line={copy.title} />
      </h2>
      <p className="mt-1 text-14 font-medium text-muted-foreground">
        {copy.subtitle}
      </p>
    </section>

    <div className="mt-5 px-5">
      <RefundDepositDemo offer={offer} depositLabel={copy.deposit} />
    </div>
    {copy.caption && (
      <p className="mt-3 px-5 text-center text-14 font-medium text-muted-foreground">
        <EmphasizedText line={copy.caption} />
      </p>
    )}

    {stored ? (
      <StoredRecord won={stored.won} history={stored.history} />
    ) : (
      <SampleRecord dailyWon={offer.dailyWon} />
    )}
  </div>
);

// 결제하면 보게 될 환급 내역과 같은 모습 — 실제 내역이 아니라 보기라 흐리게 둔다
const SampleRecord = ({ dailyWon }: { dailyWon: number }) => (
  <section className="mt-9 px-5">
    <h3 className="text-18 font-black tracking-[-0.02em] text-foreground">
      이렇게 쌓여요
    </h3>
    <div className="opacity-60">
      <RecordHead won={dailyWon * SAMPLE_DAYS} />
      <RewardHistory history={sampleHistoryOf(dailyWon)} />
    </div>
  </section>
);

// 결제 전에 이미 쌓인 돈 — 같은 자리를 진하게, 실제 내역으로 채운다
const StoredRecord = ({
  won,
  history,
}: {
  won: number;
  history: React.ReactNode;
}) => (
  <>
    <section className="mt-9 px-5">
      <h3 className="text-18 font-black tracking-[-0.02em] text-foreground">
        이미 이렇게 쌓였어요
      </h3>
      <RecordHead won={won} />
    </section>
    {history}
  </>
);

const RecordHead = ({ won }: { won: number }) => (
  <p className="mt-3 flex items-center justify-between border-b border-border pb-3.5">
    <span className="text-15 font-medium text-foreground">쌓인 환급액</span>
    <span className="text-20 font-black text-primary tabular-nums">
      {formatWon(won)}
    </span>
  </p>
);

// 아래 고정 버튼 — 환급은 프리미엄 혜택이라 결제부터다. 가격은 이어지는 페이월이 말한다
export const RewardStartButton = ({ label }: { label: string }) => {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        track(EVENTS.PAYWALL_ENTRY_TAPPED, { source: 'reward' });
        // 결제하고 돌아오면 이 화면이 다시 열린다 — 기록에 같은 화면이 두 번 쌓이지 않게 갈아 끼운다
        router.replace(
          paywallPath({
            source: 'reward',
            from: REWARD_PATH,
            step: 'checkout',
          }),
        );
      }}
    >
      {label}
    </Button>
  );
};
