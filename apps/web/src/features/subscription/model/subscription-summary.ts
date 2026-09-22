// 마이페이지 구독 카드가 보여줄 상태 — BE 구독 응답을 체험 중·구독 중·해지 예정·없음 넷으로 접고, 화면에 적을 금액을 정한다 (docs/subscription.md 「마이페이지와 법적 문서」)
import type { SubscriptionState } from '@landit/analytics';

import type {
  MySubscription,
  SubscriptionPeriodType,
} from '../api/subscription';
import { planFromProductId, type PlanId } from './plans';

export type SubscriptionSummary =
  | { kind: 'none' }
  | {
      kind: SubscriptionState;
      /** 다음 결제일 또는 이용 만료일 (BE LocalDateTime). BE가 모르면 null */
      expiresAt: string | null;
      /** 그날 결제가 이어지는가 — 해지 예약·선결제·프로모션은 그날로 끝난다 */
      renews: boolean;
      /** 월간·연간. BE가 상품 식별자를 안 주거나 모르는 상품이면 null */
      plan: PlanId | null;
      /**
       * 실제로 낸 원화 금액. 결제 이력이 없거나(무료 체험) 외화면 null.
       * null이면 화면은 금액을 말하지 않는다 — 등록값으로 추측하면 할인·가격 인상 때 남의 금액을 보여준다
       */
      price: number | null;
    };

/** 유료인 경우만 — 상태와 날짜가 있다 */
export type PaidSubscriptionSummary = Extract<
  SubscriptionSummary,
  { kind: SubscriptionState }
>;

/**
 * 화면에 그릴 수 있는 원화 결제액만 남긴다.
 *
 * 0은 청구가 없다는 뜻이고(프로모션 부여·선결제), 외화는 하루 환산과 「원」 표기가 맞지 않아 버린다.
 * 통화가 안 오면 원화로 보는 건 결제 이력(`subscription-events.ts`)과 같은 규칙이다 — 한국 스토어만 열려 있다.
 *
 * @returns 원화 결제액. 그릴 수 없으면 null
 */
const toKrwPrice = ({ price, currency }: MySubscription) =>
  price && price > 0 && (!currency || currency === 'KRW') ? price : null;

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
  const plan = planFromProductId(subscription.productId);
  const price = toKrwPrice(subscription);
  if (subscriptionStatus === 'CANCELED') {
    return {
      kind: 'canceled',
      expiresAt,
      renews: false,
      plan,
      price,
    };
  }
  return {
    kind: periodType === 'TRIAL' ? 'trial' : 'active',
    expiresAt,
    renews: periodType !== null && RENEWING_PERIODS.has(periodType),
    plan,
    price,
  };
};

/**
 * 스토어에서 해지할 구독이 있는 상태인가 — 갱신되는 체험·구독.
 * 해지 예약은 되돌리는 쪽이고, 갱신이 없는 기간(프로모션·선결제)은 스토어에 구독이 없다.
 * 구독 관리의 해지 행과 해지 사유 화면이 같은 판정을 써야 한다 — 행은 그리는데 화면이 돌려보내면 안 된다
 */
export const canCancelAtStore = (
  summary: SubscriptionSummary,
): summary is PaidSubscriptionSummary =>
  summary.kind !== 'none' && summary.kind !== 'canceled' && summary.renews;
