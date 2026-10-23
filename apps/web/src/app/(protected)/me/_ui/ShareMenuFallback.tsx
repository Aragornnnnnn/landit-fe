'use client';

// 마이페이지 지원 묶음의 공유 행 — 초대 보상이 꺼져 있거나 못 읽었을 때만 「친구에게 랜딧 공유하기」를 보인다.
// 환급과 상관없는 사람(기존 월간·연간 구독자)은 초대를 보지 않으니 늘 앱 공유다. 켜져 있으면 맨 위 친구 초대 이벤트 띠가 입구라 비운다. 조건을 받아 오는 동안도 비운다 — 앱 공유가 비쳤다가 사라지면 그새 누른 사람에게 코드 없는 공유가 나간다
import { useInviteOffer } from '@/features/referral/model/useInviteOffer';

import { useReferralAudience } from '../../_model/useReferralAudience';
import { ShareMenuEntry } from './ShareMenuEntry';

export const ShareMenuFallback = () => {
  const { summary, offer } = useInviteOffer();
  const audience = useReferralAudience();
  if (!audience.settled) return null;
  if (audience.shown && (summary.isPending || offer)) return null;
  return <ShareMenuEntry />;
};
