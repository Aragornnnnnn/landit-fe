'use client';

// 마이페이지 지원 묶음의 공유 행 — 초대 보상이 켜져 있으면 맨 위 친구 초대 이벤트 띠가 입구라 여기엔 두지 않고,
// 꺼져 있거나 못 읽었으면 지금처럼 앱 공유. 조건을 아는 동안은 비워 둔다 — 앱 공유가 비쳤다가 사라지면 그새 누른 사람에게 코드 없는 공유가 나간다
import { inviteOfferOf } from '@/features/referral/model/inviter-reward';
import { useReferralSummaryQuery } from '@/features/referral/model/useReferralSummaryQuery';

import { ShareMenuEntry } from './ShareMenuEntry';

export const InviteMenuEntry = () => {
  const { data: summary, isPending } = useReferralSummaryQuery();
  if (isPending) return null;
  if (summary && inviteOfferOf(summary.currentOffer)) return null;
  return <ShareMenuEntry />;
};
