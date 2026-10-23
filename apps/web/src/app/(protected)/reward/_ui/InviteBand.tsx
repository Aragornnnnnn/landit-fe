'use client';

// 환급 화면의 친구 초대 띠 — 「친구 초대하고 최대 N원 추가 적립」 한 줄. 누르면 친구 초대 이벤트 화면으로 간다.
// 환급을 보러 온 사람을 붙잡는 자리라 더 받을 수 있는 금액을 말하고, 아래 게이지로 얼마나 찼는지 보인다
import Link from 'next/link';

import { useInviteOffer } from '@/features/referral/model/useInviteOffer';
import { Coin } from '@/features/reward/ui/common/Coin';
import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';
import { ChevronRightIcon } from '@/shared/ui/Icons';

import { inviteBandOf } from '../_model/invite-band';

// 숨을 때는 자리째 비운다 — 바깥 여백도 띠가 들고 있다
export const InviteBand = ({ className = '' }: { className?: string }) => {
  const { offer } = useInviteOffer();
  const band = offer ? inviteBandOf(offer) : null;
  if (!band) return null;

  return (
    <Link
      href={REFERRAL_INVITE_PATH}
      className={`block rounded-2xl border border-border bg-card px-4 py-3.5 active:opacity-80 ${className}`}
    >
      <span className="flex items-center gap-2">
        <Coin size={22} className="shrink-0" />
        <span className="min-w-0 flex-1 text-15 font-black text-foreground">
          {band.lead}
          <span className="text-primary">{band.amount}</span>
          {band.tail}
        </span>
        <ChevronRightIcon
          size={18}
          className="shrink-0 text-muted-foreground"
        />
      </span>
      {band.ratio !== null && (
        <span
          role="progressbar"
          aria-label="초대 받은 친구"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={band.ratio}
          className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-invite-strip"
        >
          <span
            className="block h-full rounded-full bg-primary"
            style={{ width: `${band.ratio * 100}%` }}
          />
        </span>
      )}
    </Link>
  );
};
