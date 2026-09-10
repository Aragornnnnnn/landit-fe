// 마이페이지 구독 카드가 보여줄 상태 — BE 구독 응답을 체험 중·구독 중·해지 예정·없음 넷으로 접는다 (docs/subscription.md 「마이페이지와 법적 문서」)
import type { SubscriptionState } from '@landit/analytics';

import type {
  MySubscription,
  SubscriptionPeriodType,
} from '../api/subscription';

export type SubscriptionSummary =
  | { kind: 'none' }
  | {
      kind: SubscriptionState;
      /** 다음 결제일 또는 이용 만료일 (BE LocalDateTime). BE가 모르면 null */
      expiresAt: string | null;
      /** 그날 결제가 이어지는가 — 해지 예약·선결제·프로모션은 그날로 끝난다 */
      renews: boolean;
    };

/** 유료인 경우만 — 상태와 날짜가 있다 */
export type PaidSubscriptionSummary = Extract<
  SubscriptionSummary,
  { kind: SubscriptionState }
>;

// 만료일에 스토어가 다시 결제하는 기간 종류 — 무료 체험도 끝나면 첫 결제가 된다
const RENEWING_PERIODS = new Set<SubscriptionPeriodType>([
  'TRIAL',
  'INTRO',
  'NORMAL',
]);

/**
 * BE 구독 응답을 마이페이지 표시 상태로 바꾼다.
 * 유료 여부는 `premium`만 본다 — 만료·환불(EXPIRED)과 이력 없음(NONE)은 둘 다 "없음"이다.
 */
export const summarizeSubscription = (
  subscription: MySubscription | null,
): SubscriptionSummary => {
  if (!subscription?.premium) return { kind: 'none' };

  const { subscriptionStatus, periodType, expiresAt } = subscription;
  if (subscriptionStatus === 'CANCELED') {
    return { kind: 'canceled', expiresAt, renews: false };
  }
  return {
    kind: periodType === 'TRIAL' ? 'trial' : 'active',
    expiresAt,
    renews: periodType !== null && RENEWING_PERIODS.has(periodType),
  };
};
