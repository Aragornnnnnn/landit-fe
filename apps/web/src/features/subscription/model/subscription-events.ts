// 결제 이력 한 건을 화면 한 줄로 — 무슨 일이었는지, 어느 플랜인지, 얼마였는지 (docs/subscription.md 「마이페이지와 법적 문서」)
import type { SubscriptionEvent } from '../api/subscription';
import { findPlan, formatWon, planFromProductId } from './plans';

export interface SubscriptionEventLine {
  title: string;
  /** 월간·연간 플랜. 모르는 상품이면 null */
  plan: string | null;
  /** 결제가 있었던 이벤트만. 원화면 "58,500원", 다른 통화면 "5.99 USD" */
  amount: string | null;
  /** 테스트 결제 — 심사관·샌드박스 계정 이력 구분 */
  sandbox: boolean;
}

const TITLE: Record<
  Exclude<SubscriptionEvent['type'], 'INITIAL_PURCHASE' | 'CANCELLATION'>,
  string
> = {
  RENEWAL: '갱신 결제',
  UNCANCELLATION: '해지 취소',
  EXPIRATION: '만료',
  BILLING_ISSUE: '결제 실패',
  PRODUCT_CHANGE: '플랜 변경',
};

const toTitle = (event: SubscriptionEvent) => {
  if (event.type === 'INITIAL_PURCHASE')
    return event.periodType === 'TRIAL' ? '무료 체험 시작' : '첫 결제';
  if (event.type === 'CANCELLATION')
    return event.cancelReason === 'CUSTOMER_SUPPORT' ? '환불' : '해지 예약';
  return TITLE[event.type];
};

const toAmount = (event: SubscriptionEvent) => {
  if (event.price <= 0) return null;
  if (!event.currency || event.currency === 'KRW')
    return formatWon(event.price);
  return `${event.price.toLocaleString('ko-KR')} ${event.currency}`;
};

export const describeSubscriptionEvent = (
  event: SubscriptionEvent,
): SubscriptionEventLine => {
  const planId = planFromProductId(event.productId);
  return {
    title: toTitle(event),
    plan: planId ? `${findPlan(planId).title} 플랜` : null,
    amount: toAmount(event),
    sandbox: event.environment === 'SANDBOX',
  };
};
