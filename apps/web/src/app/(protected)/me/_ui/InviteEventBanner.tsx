'use client';

// 내 정보 맨 위 친구 초대 이벤트 띠 — 프로필 바로 아래에 두고, 누르면 친구 초대 이벤트 화면으로 간다.
// 초대 보상이 꺼져 있거나 환급과 상관없는 사람(기존 월간·연간 구독자)이면 띠 없이 지원 묶음의 「친구에게 랜딧 공유하기」만 남는다
import Link from 'next/link';

import { useInviteOffer } from '@/features/referral/model/useInviteOffer';
import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';
import { ChevronRightIcon } from '@/shared/ui/Icons';

import { inviteBannerLineOf } from '../_model/invite-banner';
import { useReferralAudience } from '../../_model/useReferralAudience';

export const InviteEventBanner = () => {
  const { offer } = useInviteOffer();
  const audience = useReferralAudience();
  if (!offer || !audience.shown) return null;

  return (
    <Link
      href={REFERRAL_INVITE_PATH}
      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 active:opacity-80"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Emoji className="size-7">🙆‍♂️</Emoji>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-black text-foreground">
          친구 초대 이벤트
        </span>
        <span className="mt-0.5 block text-[12px] font-bold break-keep text-muted-foreground">
          {inviteBannerLineOf(offer)}
        </span>
      </span>
      <ChevronRightIcon size={18} className="shrink-0 text-muted-foreground" />
    </Link>
  );
};
