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

// 초대한 사람 상한 — 인원(INVITE_COUNT)·금액(TOTAL_AMOUNT)·무제한(UNLIMITED). 무제한이면 value·used·remaining이 null
export type ReferralInviterLimitType =
  'UNLIMITED' | 'INVITE_COUNT' | 'TOTAL_AMOUNT';

export interface ReferralInviterLimit {
  type: ReferralInviterLimitType;
  // 최대 인원 또는 최대 원 금액
  value: number | null;
  // 등록 인원 또는 지금까지 정해진 초대인 지급액. 환불로 줄지 않는다
  used: number | null;
  // 남은 인원 또는 원 금액. 넘겼으면 0
  remaining: number | null;
}

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
  // 초대한 사람으로 실제 적립된 순액 — 환불은 빼고 검토 중 보존액은 포함.
  // 아래 둘은 #310 이후 서버만 준다 — 이전 서버(develop)에 붙어도 깨지지 않게 없을 수 있다고 둔다
  inviterCreditedWon?: number;
  inviterLimit?: ReferralInviterLimit;
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

/** 내 초대 코드를 발급한다 — 이미 있으면 같은 코드를 돌려준다 */
export const issueReferralCode = () =>
  api.post<string>('/api/v1/referrals/code');

export type ReferralRewardStage = 'SIGNUP' | 'PURCHASE';
export type ReferralRecipientRole = 'INVITER' | 'INVITEE';
// 지급 처리 상태 — 적립됨(CREDITED) 말고는 아직 들어오지 않았거나(대기·검토) 빠졌다(환불로 취소)
export type ReferralRewardStatus =
  'PENDING' | 'CREDITED' | 'REVIEW_REQUIRED' | 'REVERSED';

// 내가 받은 지급 한 건. 친구의 결제 금액·상품·개인정보는 오지 않는다
export interface ReferralReward {
  id: number;
  referralId: number;
  policyVersion: number;
  recipientId: number;
  stage: ReferralRewardStage;
  recipientRole: ReferralRecipientRole;
  // 정책으로 확정된 금액
  amountWon: number;
  // 이 지급이 환급 적립금에 실제로 더한 순액 — 취소되면 0
  creditedWon: number;
  status: ReferralRewardStatus;
  reason: string | null;
  createdAt: string;
}

export interface ReferralRewardPage {
  items: ReferralReward[];
  hasNext: boolean;
}

// 한 장에 받는 지급 수
export const REFERRAL_REWARD_PAGE_SIZE = 20;

/** 내 지급 내역 — 최신부터 한 장. 역할을 주면 그 역할로 받은 것만 */
export const getReferralRewards = ({
  before,
  recipientRole,
}: { before?: number; recipientRole?: ReferralRecipientRole } = {}) =>
  api.get<ReferralRewardPage>(
    `/api/v1/referrals/rewards?size=${REFERRAL_REWARD_PAGE_SIZE}${before === undefined ? '' : `&before=${before}`}${recipientRole ? `&recipientRole=${recipientRole}` : ''}`,
  );
