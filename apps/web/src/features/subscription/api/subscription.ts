// 내 구독 상태 조회 — 백엔드 응답을 그대로 반환한다 (docs/subscription.md 「BE 계약」). 잠금 판단은 premium 하나만 본다
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
}

export const getMySubscription = () =>
  api.get<MySubscription>('/api/v1/me/subscription');
