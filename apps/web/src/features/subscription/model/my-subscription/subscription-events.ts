// 결제 이력 한 건을 화면 한 줄로 접는다 — 무슨 일이었는지, 어느 플랜인지, 얼마였는지 (docs/subscription.md 「마이페이지와 법적 문서」)
import type { useTranslations } from 'next-intl';

import type { SubscriptionEvent } from '../../api/subscription';
import { formatPrice, isPricedCurrency } from '../../lib/store-price';
import { formatWon, isWonCurrency } from '../../lib/won';
import { PLAN_LABEL_KEYS, planFromProductId } from '../product/plans';

export interface SubscriptionEventSummary {
  title: string;
  /** 월간·연간 플랜. 모르는 상품이면 null */
  plan: string | null;
  /** 결제가 있었던 이벤트만. 원화면 "58,500원", 엔화면 "1,500円", 다른 통화면 "5.99 USD" */
  amount: string | null;
  /** 테스트 결제 — 심사관·샌드박스 계정 이력 구분 */
  sandbox: boolean;
}

// RevenueCat이 환불을 해지(CANCELLATION)로 보내며 붙이는 사유
const REFUND_CANCEL_REASON = 'CUSTOMER_SUPPORT';

type SubscriptionTranslator = ReturnType<
  typeof useTranslations<'subscription'>
>;

// 이벤트 한 건의 제목 문구 키 — subscription.subscriptionEvents 아래
const toTitleKey = (event: SubscriptionEvent) => {
  switch (event.type) {
    case 'INITIAL_PURCHASE':
      return event.periodType === 'TRIAL'
        ? 'trialStartLabel'
        : 'firstPurchaseLabel';
    case 'CANCELLATION':
      return event.cancelReason === REFUND_CANCEL_REASON
        ? 'refundLabel'
        : 'cancelLabel';
    case 'RENEWAL':
      return 'renewalLabel';
    case 'UNCANCELLATION':
      return 'uncancelLabel';
    case 'EXPIRATION':
      return 'expirationLabel';
    case 'BILLING_ISSUE':
      return 'billingIssueLabel';
    case 'PRODUCT_CHANGE':
      return 'productChangeLabel';
    case 'NON_RENEWING_PURCHASE':
      return 'grantLabel';
    case 'TRANSFER':
      return 'transferLabel';
    // BE가 이력에 남기는 타입이 늘어도 제목 없는 줄이 되지 않게 한다
    default:
      return 'otherLabel';
  }
};

const toAmount = (event: SubscriptionEvent) => {
  if (event.price === null || event.price <= 0) return null;
  if (isWonCurrency(event.currency)) return formatWon(event.price);
  if (isPricedCurrency(event.currency))
    return formatPrice(event.price, event.currency);
  return `${event.price.toLocaleString('ko-KR')} ${event.currency}`;
};

export const summarizeSubscriptionEvent = (
  event: SubscriptionEvent,
  t: SubscriptionTranslator,
): SubscriptionEventSummary => {
  const planId = planFromProductId(event.productId);
  return {
    title: t(`subscriptionEvents.${toTitleKey(event)}`),
    plan: planId
      ? t('subscriptionEvents.planLabel', {
          plan: t(`plans.${PLAN_LABEL_KEYS[planId]}`),
        })
      : null,
    amount: toAmount(event),
    sandbox: event.environment === 'SANDBOX',
  };
};
