'use client';

// 마이페이지 지원 묶음의 친구 초대 행 — 초대 보상이 켜져 있으면 친구 초대 화면으로, 꺼져 있거나 못 읽었으면 지금처럼 앱 공유.
// 환급 화면이 없는 기존 월간·연간 구독자도 여기서 초대 화면에 들어간다
import { inviteHeadlineOf } from '@/features/referral/model/inviter-reward';
import { useReferralSummaryQuery } from '@/features/referral/model/useReferralSummaryQuery';
import { REFERRAL_INVITE_PATH } from '@/shared/lib/routes';
import { Emoji } from '@/shared/ui/emoji';

import { MenuLink, ROW_CLASS, ROW_STYLE } from './Menu';
import { ShareMenuEntry } from './ShareMenuEntry';

export const InviteMenuEntry = () => {
  const { data: summary, isPending } = useReferralSummaryQuery();
  // 조건을 아는 동안은 같은 높이 빈 행으로 기다린다 — 앱 공유 행이 비쳤다가 초대 행으로 바뀌면, 그새 누른 사람에게 코드 없는 공유가 나간다
  if (isPending)
    return <div aria-hidden className={ROW_CLASS} style={ROW_STYLE} />;
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
