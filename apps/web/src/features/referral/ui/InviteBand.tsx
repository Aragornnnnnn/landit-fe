'use client';

// 환급 화면의 친구 초대 띠 — 초대한 친구가 없으면 「친구 초대하면 3,000원 · 초대하기」로 바로 공유 시트를,
// 있으면 「친구 2명 초대 · +11,000원」으로 친구 초대 화면을 연다. 초대 보상이 환급 적립금에 합쳐져 환급 화면 안에 둔다
import Link from 'next/link';

import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';
import { Emoji } from '@/shared/ui/emoji';
import { ChevronRightIcon } from '@/shared/ui/Icons';

import { earnedByInvitingOf, inviteHeadlineOf } from '../model/inviter-reward';
import { useInviteShare } from '../model/useInviteShare';
import { useReferralRewardsQuery } from '../model/useReferralRewardsQuery';
import { useReferralSummaryQuery } from '../model/useReferralSummaryQuery';

const BAND_CLASS =
  'flex items-center gap-3 rounded-2xl bg-primary/10 py-2.5 pl-4';

// 숨을 때는 자리째 비운다 — 바깥 여백도 띠가 들고 있다
export const InviteBand = ({ className = '' }: { className?: string }) => {
  const summary = useReferralSummaryQuery().data;
  const rewards = useReferralRewardsQuery().data;
  const { share } = useInviteShare('reward');
  if (!summary) return null;

  if (summary.invitedCount > 0)
    return (
      <Link
        href={REFERRAL_INVITE_PATH}
        className={`${BAND_CLASS} pr-3.5 ${className}`}
      >
        <Emoji className="size-6 shrink-0">🎁</Emoji>
        <span className="min-w-0 flex-1 text-[15px] font-bold text-foreground">
          친구 {summary.invitedCount}명 초대
          {rewards && ` · +${formatWon(earnedByInvitingOf(rewards))}`}
        </span>
        <ChevronRightIcon size={18} className="shrink-0 text-primary" />
      </Link>
    );

  const headline = inviteHeadlineOf(summary.currentOffer);
  if (headline === null) return null;
  return (
    <div className={`${BAND_CLASS} pr-2.5 ${className}`}>
      <Emoji className="size-6 shrink-0">🎁</Emoji>
      <span className="min-w-0 flex-1 text-[15px] font-bold text-foreground">
        {headline}
      </span>
      <button
        type="button"
        onClick={() => void share()}
        className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground active:opacity-80"
      >
        초대하기
      </button>
    </div>
  );
};
