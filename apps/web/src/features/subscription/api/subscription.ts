// 내 구독 상태 조회 — 백엔드 응답을 그대로 반환한다 (docs/subscription.md 「BE 계약」). 잠금 판단은 premium과 conversationCompletedSinceLaunch만 본다
import { api } from '@/shared/api/client';

export type SubscriptionStatus = 'NONE' | 'ACTIVE' | 'CANCELED' | 'EXPIRED';
export type SubscriptionPeriodType =
  'TRIAL' | 'INTRO' | 'NORMAL' | 'PROMOTIONAL' | 'PREPAID';

export interface MySubscription {
  // 유료 기능을 열어도 되는가 — 해지 예약(CANCELED)도 만료 전까지는 true
  premium: boolean;
  subscriptionStatus: SubscriptionStatus;
  periodType: SubscriptionPeriodType | null;
  // 만료일 또는 다음 결제일 (LocalDateTime 문자열)
  expiresAt: string | null;
  // 스토어 상품 식별자 — 플랜(월간·연간) 표시용. BE가 아직 안 줘서 선택 필드다 (docs/subscription.md 「마이페이지와 법적 문서」)
  productId?: string | null;
  // 유료 구독 도입 시점(BE 환경변수 LANDIT_SUBSCRIPTION_LAUNCHED_AT) 이후 시나리오를 끝까지 완료한 적이 있는가.
  // 도입 시점이 비어 있으면 항상 false. 구버전 BE 응답에는 없을 수 있어 선택 필드로 둔다
  conversationCompletedSinceLaunch?: boolean;
}

export const getMySubscription = () =>
  api.get<MySubscription>('/api/v1/me/subscription');
