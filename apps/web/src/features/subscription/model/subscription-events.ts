// 결제 이력 한 건을 화면 한 줄로 접는다 — 무슨 일이었는지, 어느 플랜인지, 얼마였는지 (docs/subscription.md 「마이페이지와 법적 문서」)
import type { SubscriptionEvent } from '../api/subscription';
import { findPlan, formatWon, planFromProductId } from './plans';

export interface SubscriptionEventSummary {
  title: string;
  /** 월간·연간 플랜. 모르는 상품이면 null */
  plan: string | null;
  /** 결제가 있었던 이벤트만. 원화면 "58,500원", 다른 통화면 "5.99 USD" */
  amount: string | null;
  /** 테스트 결제 — 심사관·샌드박스 계정 이력 구분 */
  sandbox: boolean;
}

// RevenueCat이 환불을 해지(CANCELLATION)로 보내며 붙이는 사유
const REFUND_CANCEL_REASON = 'CUSTOMER_SUPPORT';

const toTitle = (event: SubscriptionEvent) => {
  switch (event.type) {
    case 'INITIAL_PURCHASE':
      return event.periodType === 'TRIAL' ? '무료 체험 시작' : '첫 결제';
    case 'CANCELLATION':
      return event.cancelReason === REFUND_CANCEL_REASON ? '환불' : '해지 예약';
    case 'RENEWAL':
      return '갱신 결제';
    case 'UNCANCELLATION':
      return '해지 취소';
    case 'EXPIRATION':
      return '만료';
    case 'BILLING_ISSUE':
      return '결제 실패';
    case 'PRODUCT_CHANGE':
      return '플랜 변경';
  }
};

const toAmount = (event: SubscriptionEvent) => {
  if (event.price <= 0) return null;
  // 통화가 안 오면 원화로 본다 — 한국 스토어만 열려 있고, 원화만 "원"으로 붙인다
  const isWon = !event.currency || event.currency === 'KRW';
  if (isWon) return formatWon(event.price);
  return `${event.price.toLocaleString('ko-KR')} ${event.currency}`;
};

export const summarizeSubscriptionEvent = (
  event: SubscriptionEvent,
): SubscriptionEventSummary => {
  const planId = planFromProductId(event.productId);
  return {
    title: toTitle(event),
    plan: planId ? `${findPlan(planId).title} 플랜` : null,
    amount: toAmount(event),
    sandbox: event.environment === 'SANDBOX',
  };
};
