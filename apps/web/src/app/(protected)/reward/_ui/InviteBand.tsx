'use client';

// 환급 화면의 친구 초대 띠 — 「친구 초대하고 N원씩 받기」와 진행 막대. 누르면 친구 초대 이벤트 화면으로 간다.
// 돈이 쌓이는 걸 보러 오는 화면이라 몇 명 더 초대하면 얼마인지가 보이게 진행으로 그린다. 10명을 채워도 친구 몫이 남아 띠는 그대로 둔다
import Link from 'next/link';

import { inviteOfferOf } from '@/features/referral/model/inviter-reward';
import { useReferralSummaryQuery } from '@/features/referral/model/useReferralSummaryQuery';
import { Coin } from '@/features/reward/ui/common/Coin';
import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';
import { formatWon } from '@/shared/lib/won';
import { ChevronRightIcon } from '@/shared/ui/Icons';

import { inviteBandOf } from '../_model/invite-band';

// 숨을 때는 자리째 비운다 — 바깥 여백도 띠가 들고 있다
export const InviteBand = ({ className = '' }: { className?: string }) => {
  const summary = useReferralSummaryQuery().data;
  const offer = summary ? inviteOfferOf(summary.currentOffer) : null;
  if (!summary || !offer) return null;
  const band = inviteBandOf({ offer, invitedCount: summary.invitedCount });

  return (
    <Link
      href={REFERRAL_INVITE_PATH}
      className={`block rounded-2xl border border-border bg-card px-4 pt-3 pb-3.5 active:opacity-80 ${className}`}
    >
      <span className="flex items-center gap-2">
        <Coin size={22} className="shrink-0" />
        <span className="min-w-0 flex-1 text-[15px] font-black text-foreground">
          친구 초대하고{' '}
          <span className="text-primary">{formatWon(band.inviterWon)}</span>씩
          받기
        </span>
        <span className="shrink-0 text-[12px] font-bold text-muted-foreground tabular-nums">
          {band.sideLabel}
        </span>
        <ChevronRightIcon
          size={18}
          className="shrink-0 text-muted-foreground"
        />
      </span>
      <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-primary/15">
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${band.ratio * 100}%` }}
        />
      </span>
    </Link>
  );
};
