'use client';

// 친구 초대 화면 — 초대로 받은 돈, 지금 조건, 내 코드(복사), 가입만 한 친구에게 한 번 더 권하기, 받은 보상, 보내기 버튼
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type {
  ReferralPreview,
  ReferralReward,
} from '@/features/referral/api/referral';
import { inviteRewardRowOf } from '@/features/referral/model/invite-reward-row';
import {
  earnedByInvitingOf,
  inviterWonOf,
} from '@/features/referral/model/inviter-reward';
import { useInviteShare } from '@/features/referral/model/useInviteShare';
import { useReferralCode } from '@/features/referral/model/useReferralCode';
import { useReferralRewardsQuery } from '@/features/referral/model/useReferralRewardsQuery';
import { useReferralSummaryQuery } from '@/features/referral/model/useReferralSummaryQuery';
import { track } from '@/shared/analytics';
import { formatWon } from '@/shared/lib/won';
import { BackHeader } from '@/shared/ui/BackHeader';
import { Button } from '@/shared/ui/Button';
import { RetryNotice } from '@/shared/ui/RetryNotice';
import { showToast } from '@/shared/ui/toast';

// 네 자씩 끊어 보여 준다 — 말로 불러 주거나 눈으로 옮겨 칠 때 덜 틀린다. 복사는 붙인 그대로
const CODE_GROUP = 4;
const displayCode = (code: string) =>
  `${code.slice(0, CODE_GROUP)}–${code.slice(CODE_GROUP)}`;

export const InviteScreen = () => {
  const router = useRouter();
  const summary = useReferralSummaryQuery();
  const rewards = useReferralRewardsQuery();
  const code = useReferralCode();
  const { share } = useInviteShare('invite');

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      track(EVENTS.REFERRAL_CODE_COPIED);
      showToast('초대 코드를 복사했어요');
    } catch {
      showToast('초대 코드를 복사하지 못했어요');
    }
  };

  return (
    <main className="flex h-dvh flex-col bg-background">
      <BackHeader title="친구 초대" onBack={() => router.back()} />

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {summary.isError ? (
          <RetryNotice
            screen="referral_invite"
            message={summary.error.message}
            onRetry={() => summary.refetch()}
          />
        ) : (
          <>
            <p className="text-[13px] font-bold text-primary">
              친구 초대로 받은 돈
            </p>
            <p className="mt-0.5 text-[36px] leading-tight font-black text-foreground">
              {rewards.data ? formatWon(earnedByInvitingOf(rewards.data)) : '—'}
            </p>
            {summary.data && <OfferChips offer={summary.data.currentOffer} />}

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card py-3 pr-3 pl-4">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-muted-foreground">
                  내 초대 코드
                </p>
                <p className="text-[22px] font-black tracking-wide text-foreground">
                  {code ? displayCode(code) : '—'}
                </p>
              </div>
              <button
                type="button"
                disabled={!code}
                onClick={() => void copyCode()}
                className="rounded-full bg-secondary px-3.5 py-2 text-sm font-bold text-secondary-foreground active:opacity-80 disabled:opacity-45"
              >
                복사
              </button>
            </div>

            {summary.data && (
              <PurchaseNudge
                waiting={
                  summary.data.invitedCount - summary.data.convertedCount
                }
                purchaseWon={inviterWonOf(summary.data.currentOffer.purchase)}
              />
            )}

            <h2 className="mt-7 text-[15px] font-bold text-foreground">
              받은 보상
            </h2>
            <RewardRows rewards={rewards.data} />

            <p className="mt-6 text-[12px] leading-[1.6] break-keep text-muted-foreground">
              친구 이름과 결제 금액은 보이지 않아요. 초대로 받은 돈은 환급
              적립금에 더해져, 100일 이용권 기간이 끝날 때 함께 돌려받아요
            </p>
          </>
        )}
      </div>

      <div className="px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),20px)]">
        <Button disabled={!summary.data} onClick={() => void share()}>
          친구에게 코드 보내기
        </Button>
      </div>
    </main>
  );
};

// 지금 초대하면 친구 한 명당 받는 금액 — 받을 몫이 있는 단계만
const OfferChips = ({
  offer,
}: {
  offer: Pick<ReferralPreview, 'signup' | 'purchase'>;
}) => {
  const chips = [
    ['친구 가입', inviterWonOf(offer.signup)],
    ['친구 결제', inviterWonOf(offer.purchase)],
  ] as const;
  return (
    <div className="mt-2 flex gap-1.5">
      {chips
        .filter(([, won]) => won > 0)
        .map(([label, won]) => (
          <span
            key={label}
            className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-bold text-secondary-foreground"
          >
            {label} {formatWon(won)}
          </span>
        ))}
    </div>
  );
};

// 가입만 하고 아직 결제하지 않은 친구가 있으면 결제 보상을 한 번 더 알린다
const PurchaseNudge = ({
  waiting,
  purchaseWon,
}: {
  waiting: number;
  purchaseWon: number;
}) =>
  waiting > 0 && purchaseWon > 0 ? (
    <div className="mt-3 rounded-2xl bg-primary/10 px-4 py-3">
      <p className="text-[14px] font-bold text-foreground">
        가입만 한 친구가 {waiting}명 있어요
      </p>
      <p className="mt-0.5 text-[13px] font-medium text-primary">
        그 친구가 결제하면 {formatWon(purchaseWon)}을 더 받아요
      </p>
    </div>
  ) : null;

// 초대한 사람으로 받은 것만 — 내가 초대받아 받은 몫은 여기 적지 않는다
const RewardRows = ({ rewards }: { rewards: ReferralReward[] | undefined }) => {
  if (!rewards) return null;
  const rows = rewards
    .filter((reward) => reward.recipientRole === 'INVITER')
    .map(inviteRewardRowOf);
  if (rows.length === 0)
    return (
      <p className="py-5 text-center text-[13px] font-medium text-muted-foreground">
        아직 받은 보상이 없어요
      </p>
    );
  return (
    <ul className="mt-1">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-3 pt-4">
          <span className="w-9 shrink-0 text-[13px] font-medium text-muted-foreground tabular-nums">
            {row.dateLabel}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-foreground">
              {row.title}
            </span>
            <span className="mt-0.5 block text-[12px] font-medium text-muted-foreground tabular-nums">
              {row.time}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span
              className={`block text-[15px] font-black tabular-nums ${row.settled ? 'text-primary' : 'text-muted-foreground/60'}`}
            >
              {row.amountLabel}
            </span>
            <span className="mt-0.5 block text-[12px] font-medium text-muted-foreground">
              {row.statusLabel}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
};
