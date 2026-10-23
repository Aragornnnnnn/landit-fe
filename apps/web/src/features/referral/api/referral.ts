// 친구 초대 API — 백엔드 ReferralViews(Preview·Summary)·ReferralRegistrationRequest를 그대로 미러한다
import { api } from '@/shared/api/client';

// 단계별 보상을 누가 받는가 — 초대한 사람만 / 초대받은 사람만 / 둘 다
export type ReferralTarget = 'NONE' | 'INVITER' | 'INVITEE' | 'BOTH';

// 가입·결제 한 단계의 지급 조건. 꺼져 있으면 대상 NONE, 금액 0
export interface ReferralStage {
  enabled: boolean;
  target: ReferralTarget;
  inviterWon: number;
  inviteeWon: number;
}

// 개인정보 없는 초대 조건 — 코드 확인(preview)과 내 초대 조건이 같은 모양이다
export interface ReferralPreview {
  // 내 초대 조건·가입 당시 조건에서는 null
  code: string | null;
  // 등록할 때 함께 보내야 하는 정책 버전 — 그새 바뀌면 등록이 409로 거절된다
  policyVersion: number;
  signup: ReferralStage;
  purchase: ReferralStage;
  // 결제 보상 대상 상품 이름
  purchaseProductNames: string[];
}

// 온보딩에서 코드를 넣을 수 있는가 — PENDING만 등록할 수 있고, 나머지는 끝났거나 대상이 아니다(이전 가입자는 UNAVAILABLE)
export type ReferralRegistrationStatus =
  'PENDING' | 'REGISTERED' | 'SKIPPED' | 'UNAVAILABLE';

export interface ReferralSummary {
  // 아직 발급 전이면 null — 발급은 POST /referrals/code
  code: string | null;
  // 지금 새로 초대하면 적용되는 조건
  currentOffer: ReferralPreview;
  // 내가 초대받아 가입할 때 고정된 조건. 초대받지 않았으면 null
  enrolledOffer: ReferralPreview | null;
  invitedCount: number;
  convertedCount: number;
  registrationStatus: ReferralRegistrationStatus;
}

export const getReferralSummary = () =>
  api.get<ReferralSummary>('/api/v1/referrals/me');

/** 코드가 유효한지와 지금 보상 조건을 확인한다. 쓸 수 없는 코드면 ApiError(REFERRAL_CODE_INVALID 등) */
export const previewReferralCode = (code: string) =>
  api.get<ReferralPreview>(
    `/api/v1/referrals/preview?code=${encodeURIComponent(code)}`,
  );

/** 신규 가입자의 초대 코드 등록 — 성공하면 가입 보상이 적립된다 */
export const registerReferralCode = (body: {
  code: string;
  policyVersion: number;
}) => api.post<null>('/api/v1/referrals/registration', body);

/** 코드 입력을 영구히 건너뛴다 — 부르지 않으면 PENDING으로 남아 다음에 또 묻는다 */
export const skipReferralRegistration = () =>
  api.post<null>('/api/v1/referrals/registration/skip');
