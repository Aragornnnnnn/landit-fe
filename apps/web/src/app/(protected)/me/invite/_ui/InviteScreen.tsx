'use client';

// 친구 초대 이벤트 화면 — 둘이 받는 금액, 초대로 받은 적립금과 10명 진행, 받는 방법, 내 코드(복사), 보내기 버튼.
// 자세한 조건은 헤더 ⓘ 시트로 뺀다 — 화면에는 받는 이유와 방법만 둔다
import { useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import type { ReferralReward } from '@/features/referral/api/referral';
import type { InviteOffer } from '@/features/referral/model/inviter-reward';
import { useInviteOffer } from '@/features/referral/model/useInviteOffer';
import { useInviteShare } from '@/features/referral/model/useInviteShare';
import { useReferralCode } from '@/features/referral/model/useReferralCode';
import { useReferralRewardsQuery } from '@/features/referral/model/useReferralRewardsQuery';
import { Coin } from '@/features/reward/ui/common/Coin';
import { track } from '@/shared/analytics';
import { backToMyPage } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';
import { BackHeader } from '@/shared/ui/BackHeader';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Emoji } from '@/shared/ui/emoji';
import { HeaderAction } from '@/shared/ui/HeaderAction';
import { ChevronDownIcon, InfoIcon } from '@/shared/ui/Icons';
import { RetryNotice } from '@/shared/ui/RetryNotice';
import { showToast } from '@/shared/ui/toast';

import { inviteEventViewOf, stepRewardsOf } from '../_model/invite-event';
import {
  inviteRewardRowOf,
  shownInviteRewardsOf,
} from '../_model/invite-reward-row';

// 네 자씩 끊어 보여 준다 — 말로 불러 주거나 눈으로 옮겨 칠 때 덜 틀린다. 복사는 붙인 그대로
const CODE_GROUP = 4;
const displayCode = (code: string) =>
  `${code.slice(0, CODE_GROUP)}–${code.slice(CODE_GROUP)}`;

// 받은 내역은 최근 몇 건만 — 나머지는 「모두 보기」로 그 자리에서 펼친다(많아야 상한 인원만큼이라 따로 화면을 두지 않는다)
const RECENT_COUNT = 3;

export const InviteScreen = () => {
  const router = useRouter();
  const { summary, offer } = useInviteOffer();
  const rewards = useReferralRewardsQuery();
  const code = useReferralCode();
  const { ready, share } = useInviteShare();
  const [infoOpen, setInfoOpen] = useState(false);

  const view = offer
    ? inviteEventViewOf({
        offer,
        invitedCount: summary.data?.invitedCount ?? 0,
        earnedWon: summary.data?.inviterCreditedWon ?? 0,
      })
    : null;

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
      <BackHeader
        title="친구 초대 이벤트"
        onBack={() => backToMyPage(router)}
        trailing={
          offer && (
            <HeaderAction
              label="친구 초대 안내"
              onClick={() => setInfoOpen(true)}
            >
              <InfoIcon size={22} />
            </HeaderAction>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6">
        {summary.isError ? (
          <RetryNotice
            screen="referral_invite"
            message={summary.error.message}
            onRetry={() => summary.refetch()}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {offer && view && (
              <>
                <h2 className="pt-1 text-center text-xl font-black break-keep text-foreground">
                  {view.title}
                </h2>
                <RewardSplit offer={offer} />
                <Progress
                  view={view}
                  earnedWon={summary.data?.inviterCreditedWon ?? 0}
                  offer={offer}
                  rewards={rewards.data}
                  rewardsFailed={rewards.isError}
                  onRetryRewards={() => rewards.refetch()}
                />
                <Steps offer={offer} full={view.full} />
              </>
            )}

            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card py-3 pr-3 pl-4">
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
                aria-label="초대 코드 복사"
                onClick={() => void copyCode()}
                className="rounded-full bg-secondary px-3.5 py-2 text-sm font-bold text-secondary-foreground active:opacity-80 disabled:opacity-45"
              >
                복사
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pt-3 pb-[max(var(--safe-area-inset-bottom),20px)]">
        <Button disabled={!ready} onClick={() => void share()}>
          {view?.shareLabel ?? '친구에게 초대 코드 보내기'}
        </Button>
      </div>

      {offer && (
        <InfoSheet
          open={infoOpen}
          offer={offer}
          onClose={() => setInfoOpen(false)}
        />
      )}
    </main>
  );
};

// 나와 초대받은 친구가 각각 얼마를 받는지 — 두 사람 얼굴로 누가 받는지 먼저 읽히게 한다. 조건은 아래 띠 한 줄
const RewardSplit = ({ offer }: { offer: InviteOffer }) => (
  <div className="overflow-hidden rounded-[20px] bg-invite">
    <div className="flex items-center px-3 pt-5 pb-4">
      <SplitSide emoji="🙋" who="나" won={offer.inviterWon} />
      {offer.inviteeWon > 0 && (
        <>
          <span aria-hidden className="h-[72px] w-px bg-invite-strip" />
          <SplitSide emoji="🙆‍♂️" who="초대 받은 친구" won={offer.inviteeWon} />
        </>
      )}
    </div>
    <p className="bg-invite-strip py-2.5 text-center text-[13px] font-bold text-invite-ink">
      친구가 가입할 때 내 코드를 넣으면 바로 적립돼요
    </p>
  </div>
);

const SplitSide = ({
  emoji,
  who,
  won,
}: {
  emoji: string;
  who: string;
  won: number;
}) => (
  <div className="flex flex-1 flex-col items-center gap-1">
    <Emoji className="size-11">{emoji}</Emoji>
    <p className="mt-1 text-[13px] font-bold text-muted-foreground">{who}</p>
    <p className="text-xl font-black text-foreground">
      <span className="text-primary">{formatWon(won)}</span> 적립
    </p>
  </div>
);

// 초대로 받은 적립금과 상한까지의 진행, 받은 내역 — 상한을 채우면 받은 금액 한 마디로 바꾼다
const Progress = ({
  view,
  earnedWon,
  offer,
  rewards,
  rewardsFailed,
  onRetryRewards,
}: {
  view: ReturnType<typeof inviteEventViewOf>;
  earnedWon: number;
  offer: InviteOffer;
  rewards: ReferralReward[] | undefined;
  rewardsFailed: boolean;
  onRetryRewards: () => void;
}) => {
  if (view.full)
    return (
      <div className="rounded-[20px] bg-invite px-5 py-5 text-center">
        <p className="text-[13px] font-bold text-primary">
          친구 {offer.limitCount}명 초대 완료
        </p>
        <p className="mt-1 text-xl font-black text-foreground">
          <span className="text-primary">{formatWon(earnedWon)}</span>
          {view.fullAllEarned ? '을 모두 받았어요' : '을 받았어요'}
        </p>
        {offer.inviteeWon > 0 && (
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
            이제 초대하면 친구만 {formatWon(offer.inviteeWon)}을 받아요
          </p>
        )}
      </div>
    );

  return (
    <div className="rounded-[20px] bg-invite p-5">
      <p className="text-[13px] font-bold text-muted-foreground">
        친구 초대로 받은 적립금
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-2xl font-black text-foreground">
        <Coin size={26} />
        {formatWon(earnedWon)}
      </p>

      <div className="mt-4 flex items-center justify-between text-[13px] font-bold">
        <span className="text-foreground">{view.countLabel}</span>
        {view.progressLabel && (
          <span className="text-muted-foreground tabular-nums">
            {view.progressLabel}
          </span>
        )}
      </div>
      {view.ratio !== null && (
        <div
          role="progressbar"
          aria-label="초대 받은 친구"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={view.ratio}
          className="mt-2 h-2 overflow-hidden rounded-full bg-invite-strip"
        >
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${view.ratio * 100}%` }}
          />
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-card px-4 py-1">
        {rewardsFailed ? (
          <RetryNotice
            screen="referral_invite"
            message="받은 내역을 불러오지 못했어요"
            onRetry={onRetryRewards}
          />
        ) : (
          <RewardRows rewards={rewards} />
        )}
      </div>
    </div>
  );
};

// 초대한 사람으로 받은 것만 서버가 걸러 준다 — 상한을 넘겨 0원이 된 건 여기서 뺀다
const RewardRows = ({ rewards }: { rewards: ReferralReward[] | undefined }) => {
  const [expanded, setExpanded] = useState(false);
  if (!rewards) return null;
  const rows = shownInviteRewardsOf(rewards).map(inviteRewardRowOf);
  if (rows.length === 0)
    return (
      <p className="py-4 text-center text-[13px] font-medium text-muted-foreground">
        아직 가입한 친구가 없어요
      </p>
    );
  const shown = expanded ? rows : rows.slice(0, RECENT_COUNT);
  return (
    <>
      <ul>
        {shown.map((row) => (
          <li key={row.id} className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-foreground">
                {row.title}
              </span>
              <span className="mt-0.5 block text-[12px] font-medium text-muted-foreground">
                {row.dateLabel}
                {!row.settled && ` · ${row.statusLabel}`}
              </span>
            </span>
            <span
              className={`shrink-0 text-[15px] font-black tabular-nums ${row.settled ? 'text-primary' : 'text-muted-foreground/60'} ${row.canceled ? 'line-through' : ''}`}
            >
              {row.amountLabel}
            </span>
          </li>
        ))}
      </ul>
      {rows.length > RECENT_COUNT && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="flex w-full items-center justify-center gap-1 pt-1 pb-3 text-[13px] font-bold text-muted-foreground"
        >
          {expanded ? '접기' : '모두 보기'}
          <ChevronDownIcon
            size={14}
            className={expanded ? 'rotate-180' : undefined}
          />
        </button>
      )}
    </>
  );
};

// 받는 방법 — 단계마다 한 줄로만
const Steps = ({ offer, full }: { offer: InviteOffer; full: boolean }) => {
  const rewards = stepRewardsOf(offer, full);
  const steps = [
    '내 초대 코드 보내기',
    '친구가 코드 넣고 가입하면',
    <>
      바로{' '}
      {rewards.map((part, index) => (
        <span key={part.who}>
          {index > 0 && ' · '}
          {part.who} <Won won={part.won} />
        </span>
      ))}{' '}
      적립
    </>,
  ];
  return (
    <div className="rounded-[20px] bg-card p-5">
      <h3 className="text-[15px] font-black text-foreground">이렇게 받아요</h3>
      <ol className="mt-1">
        {steps.map((step, index) => (
          <li key={index} className="flex items-center gap-3.5 pt-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-black text-foreground">
              {index + 1}
            </span>
            <span className="text-[15px] font-bold text-foreground">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

const Won = ({ won }: { won: number }) => (
  <span className="text-primary">{formatWon(won)}</span>
);

// 헤더 ⓘ — 돈이 어디로 가는지와 취소될 수 있는 경우만. 화면에서 이미 말한 건 되풀이하지 않는다
const InfoSheet = ({
  open,
  offer,
  onClose,
}: {
  open: boolean;
  offer: InviteOffer;
  onClose: () => void;
}) => (
  <BottomSheet open={open} onClose={onClose}>
    <BottomSheet.Title className="text-lg font-black text-foreground">
      친구 초대 안내
    </BottomSheet.Title>
    <ul className="mt-3 flex flex-col gap-2 text-[14px] leading-[1.55] font-medium break-keep text-foreground/80">
      <li>· 적립금은 100일 이용권이 끝날 때 받는 환급금에 더해져요</li>
      <li>
        · 친구 한 명당 {formatWon(offer.inviterWon)}씩
        {offer.maxWon !== null && `, 최대 ${formatWon(offer.maxWon)}까지`}{' '}
        적립돼요
      </li>
      <li>· 부정 이용이 확인되면 적립이 취소될 수 있어요</li>
      <li>· 혜택은 바뀌거나 취소될 수 있지만, 적립금은 그대로예요</li>
    </ul>
    <Button className="mt-6" onClick={onClose}>
      확인했어요
    </Button>
  </BottomSheet>
);
