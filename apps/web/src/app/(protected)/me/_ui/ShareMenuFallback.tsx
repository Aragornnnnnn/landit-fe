'use client';

// 마이페이지 지원 묶음의 공유 행 — 맨 위 친구 초대 이벤트 띠가 없을 때만 「친구에게 랜딧 공유하기」를 보인다(띠와 같은 판정이라 둘 다 없는 빈 상태가 없다).
// 조건을 받아 오는 동안은 비운다 — 앱 공유가 비쳤다가 사라지면 그새 누른 사람에게 코드 없는 공유가 나간다
import { useInviteOffer } from '@/features/referral/model/useInviteOffer';

import { inviteBannerLinesOf } from '../_model/invite-banner';
import { useReferralAudience } from '../../_model/useReferralAudience';
import { ShareMenuEntry } from './ShareMenuEntry';

export const ShareMenuFallback = () => {
  const { summary, offer } = useInviteOffer();
  const audience = useReferralAudience();
  if (!audience.settled) return null;
  const bannerShown = offer !== null && inviteBannerLinesOf(offer) !== null;
  if (audience.shown && (summary.isPending || bannerShown)) return null;
  return <ShareMenuEntry />;
};
