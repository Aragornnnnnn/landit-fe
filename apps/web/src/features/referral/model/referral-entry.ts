// 온보딩 초대 코드 단계를 열지 — 친구 초대가 열려 있고, 서버가 등록할 수 있다고 하고(PENDING), 지금 받을 초대 보상이 하나라도 켜져 있을 때만
import type { ReferralSummary } from '../api/referral';

// 보상이 모두 꺼져 있으면 미리보기가 REFERRAL_DISABLED로 거절해 건너뛰기만 남는다.
// 건너뛰면 영구로 남아 나중에 켜져도 못 넣으니, 단계를 아예 열지 않고 PENDING을 그대로 둔다
export const canEnterReferralStep = (
  summary:
    Pick<ReferralSummary, 'registrationStatus' | 'currentOffer'> | undefined,
  // 친구 초대가 열려 있는가 — 판매 규칙(useOffers)의 답
  referralLive: boolean,
) =>
  referralLive &&
  summary?.registrationStatus === 'PENDING' &&
  (summary.currentOffer.signup.enabled ||
    summary.currentOffer.purchase.enabled);
