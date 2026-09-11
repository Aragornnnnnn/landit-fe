// 내 구독 상태 조회 — 백엔드 응답을 그대로 반환한다 (docs/subscription.md 「BE 계약」). 잠금 판단은 premium과 conversationCompletedSinceLaunch만 본다
import { api } from '@/shared/api/client';

export type SubscriptionStatus = 'NONE' | 'ACTIVE' | 'CANCELED' | 'EXPIRED';
// RevenueCat store 값 (BE SubscriptionStore). 구독 관리 링크를 고를 때 APP_STORE·PLAY_STORE만 본다
export type SubscriptionStore =
  | 'APP_STORE'
  | 'MAC_APP_STORE'
  | 'PLAY_STORE'
  | 'AMAZON'
  | 'STRIPE'
  | 'PROMOTIONAL'
  | 'RC_BILLING'
  | 'ROKU'
  | 'PADDLE'
  | 'TEST_STORE';

export type SubscriptionPeriodType =
  'TRIAL' | 'INTRO' | 'NORMAL' | 'PROMOTIONAL' | 'PREPAID';

export interface MySubscription {
  // 유료 기능을 열어도 되는가 — 해지 예약(CANCELED)도 만료 전까지는 true
  premium: boolean;
  subscriptionStatus: SubscriptionStatus;
  periodType: SubscriptionPeriodType | null;
  // 만료일 또는 다음 결제일 (LocalDateTime 문자열)
  expiresAt: string | null;
  // 스토어 상품 식별자 — 플랜(월간·연간) 표시용. BE #175부터 온다. 프리미엄이 꺼져 있으면 null
  productId?: string | null;
  // 결제한 스토어 — 구독 관리 링크를 셸 플랫폼 대신 이걸로 고른다. 프리미엄이 꺼져 있으면 null
  store?: SubscriptionStore | null;
  // 유료 구독 도입 시점(BE 환경변수 LANDIT_SUBSCRIPTION_LAUNCHED_AT) 이후 시나리오를 끝까지 완료한 적이 있는가.
  // 도입 시점이 비어 있으면 항상 false. 구버전 BE 응답에는 없을 수 있어 선택 필드로 둔다
  conversationCompletedSinceLaunch?: boolean;
}

export const getMySubscription = () =>
  api.get<MySubscription>('/api/v1/me/subscription');

// RevenueCat 웹훅을 BE가 쌓은 결제 이력 한 건 (BE #175 SubscriptionEventResponse)
export type SubscriptionEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE';

export interface SubscriptionEvent {
  eventId: string;
  type: SubscriptionEventType;
  productId: string | null;
  periodType: SubscriptionPeriodType | null;
  // 결제 통화 기준 금액. 체험·해지처럼 결제가 없으면 0
  price: number;
  // ISO 4217. 없으면 null
  currency: string | null;
  store: SubscriptionStore | null;
  // 심사관·테스트 계정 결제는 SANDBOX
  environment: 'SANDBOX' | 'PRODUCTION';
  // CANCELLATION만. 환불이면 CUSTOMER_SUPPORT
  cancelReason: string | null;
  occurredAt: string;
  expiresAt: string | null;
}

// 최근 50건, 최신순. 페이지 없음
export const getSubscriptionEvents = () =>
  api.get<SubscriptionEvent[]>('/api/v1/me/subscription/events');
