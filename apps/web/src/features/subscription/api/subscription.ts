// 내 구독 상태 조회 — 백엔드 응답을 그대로 반환한다 (docs/subscription.md 「BE 계약」). 잠금 판단은 premium만 본다
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

/** 페이월을 닫고 얻은 한시 할인 — 남은 시간이 0이 되면 BE가 null로 내린다 (docs/subscription.md) */
export interface PaywallPromo {
  /** 받은 순간 기준 남은 초. 기기 시계와 무관하게 재려고 서버가 계산해 준다 */
  remainingSeconds: number;
  /** 만료 시각 (BE LocalDateTime). 표시·디버깅용 */
  expiresAt: string;
  /** 부여 시점에 가입 후 7일 미만이었는지. 시트에 "신규 유저 혜택" 라벨을 붙일지 정한다 */
  newUser: boolean;
}

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
  // 가장 최근 실제 결제의 금액과 ISO 4217 통화 — 앞으로 청구될 금액이 아니라 결제 이력이다.
  // 같은 상품 id로 서로 다른 금액을 내는 구독자가 있어 상품으로는 알 수 없다. 결제 이력이 없으면(무료 체험) null
  price?: number | null;
  currency?: string | null;
  // 진행 중인 한시 할인. 없거나 끝났으면 null — 홈 배지와 할인 시트가 이걸 보고 그린다
  promo?: PaywallPromo | null;
  // 유료 구독 도입 시점(BE 환경변수 LANDIT_SUBSCRIPTION_LAUNCHED_AT) 이후 시나리오를 끝까지 완료한 적이 있는가.
  // 대화가 무제한이 되면서(landit-be#192) 잠금 판단에는 쓰지 않는다. BE가 계속 내려주므로 미러만 둔다
  conversationCompletedSinceLaunch?: boolean;
  // 아래 다섯은 BE LAN-474·#172가 더한 배포 전환·첫 시나리오 예약 정보 — 웹은 아직 안 쓴다. 응답 미러로만 둔다
  // 현재 계정에 페이월 표시와 서버 유료 제한을 적용하는지
  paymentEnabled?: boolean;
  paymentPolicyVersion?: number;
  // 배포 전환으로 새 학습 시작만 일시 중지됐는지
  newStartsPaused?: boolean;
  // 시나리오 대화는 구독과 관계없이 허용하므로 배포 전환 중이 아니면 항상 true
  canStartScenario?: boolean;
  // 유료 도입 후 무료 상태로 처음 시작한 첫 시나리오의 예약 세션. 24시간 내 같은 시나리오 재시작 시 이어간다
  freeScenarioSessionId?: number | null;
}

export const getMySubscription = () =>
  api.get<MySubscription>('/api/v1/me/subscription');

/**
 * 페이월을 닫았다고 알린다 — 처음이면 서버가 5분 만료 시각을 찍는다.
 *
 * 멱등이라 다시 닫아도 남은 시간만 돌아온다. 자격이 없으면(이미 끝남·유료) promo가 null이다.
 */
export const dismissPaywall = () =>
  api.post<{ promo: PaywallPromo | null }>('/api/v1/me/paywall/dismiss');

// RevenueCat 웹훅을 BE가 쌓은 결제 이력 한 건 (BE #175 SubscriptionEventResponse)
export type SubscriptionEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'UNCANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE'
  | 'PRODUCT_CHANGE'
  // 대시보드에서 부여한 무료 이용 기간. 우리는 일회성 상품이 없어 이 타입은 프로모션 부여뿐이다
  | 'NON_RENEWING_PURCHASE'
  // 다른 앱 계정에서 구독을 넘겨받음
  | 'TRANSFER';

export interface SubscriptionEvent {
  eventId: string;
  type: SubscriptionEventType;
  productId: string | null;
  periodType: SubscriptionPeriodType | null;
  // 결제 통화 기준 금액. 체험·해지·프로모션처럼 결제가 없으면 0이거나 null
  price: number | null;
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
