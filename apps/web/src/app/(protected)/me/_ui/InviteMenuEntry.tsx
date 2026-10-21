'use client';

// 마이페이지 지원 묶음의 친구 초대 행 — 초대 보상이 켜져 있으면 친구 초대 화면으로, 꺼져 있거나 못 읽었으면 지금처럼 앱 공유.
// 환급 화면이 없는 기존 월간·연간 구독자도 여기서 초대 화면에 들어간다
import { inviteHeadlineOf } from '@/features/referral/model/inviter-reward';
import { useReferralSummaryQuery } from '@/features/referral/model/useReferralSummaryQuery';
import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';

import { MenuLink } from './Menu';
import { ShareMenuEntry } from './ShareMenuEntry';

export const InviteMenuEntry = () => {
  const summary = useReferralSummaryQuery().data;
  const headline = summary ? inviteHeadlineOf(summary.currentOffer) : null;
  if (headline === null) return <ShareMenuEntry />;
  return (
    <MenuLink
      href={REFERRAL_INVITE_PATH}
      icon={<Emoji>🎁</Emoji>}
      title={`${headline} 받기`}
    />
  );
};
