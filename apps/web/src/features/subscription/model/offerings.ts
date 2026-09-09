// 셸이 준 오퍼링(패키지 목록)을 플랜별 가격표로 바꾼다 — 화면은 원화 숫자로 표시값을 덮어쓰고, 결제 요청에는 packageId를 쓴다
import type { OfferingPackage, SubscriptionPlan } from '@landit/bridge';

/** 플랜 하나에 대응하는 스토어 패키지 — 결제에 쓸 id와 스토어가 정한 가격 */
export interface PlanPricing {
  packageId: string;
  price: number;
  /** ISO 4217 통화 코드 (KRW, USD …) */
  currency: string;
}

/** 플랜별 가격표. 오퍼링에 없는 플랜은 비어 있다 */
export type PlanPricingMap = Partial<Record<SubscriptionPlan, PlanPricing>>;

/** 셸 패키지 목록을 플랜별 가격표로 접는다. 같은 플랜이 둘이면 앞의 것 — 오퍼링 순서가 곧 우선순위다 */
export const toPlanPricing = (packages: OfferingPackage[]): PlanPricingMap => {
  const map: PlanPricingMap = {};
  for (const pkg of packages) {
    if (map[pkg.plan]) continue;
    map[pkg.plan] = {
      packageId: pkg.id,
      price: pkg.price,
      currency: pkg.currency,
    };
  }
  return map;
};

const krwPrice = (pricing?: PlanPricing) =>
  pricing?.currency === 'KRW' ? pricing.price : undefined;

/**
 * 스토어 가격 중 원화만 숫자로 뽑는다.
 *
 * 다른 통화는 월 환산·할인율 산식이 맞지 않아 비워 두고, 화면은 등록값을 쓴다 (해외 스토어프런트는 다음 이슈).
 */
export const toKrwPrices = (
  pricing: PlanPricingMap,
): Partial<Record<SubscriptionPlan, number>> => ({
  monthly: krwPrice(pricing.monthly),
  yearly: krwPrice(pricing.yearly),
});

/** 오퍼링을 못 받았을 때 결제에 쓸 RevenueCat 표준 패키지 identifier — 셸이 identifier로 패키지를 찾는다 */
export const DEFAULT_PACKAGE_IDS: Record<SubscriptionPlan, string> = {
  monthly: '$rc_monthly',
  yearly: '$rc_annual',
};

/** 결제에 쓸 패키지 id — 가격표에 있으면 그 패키지, 없으면 표준 identifier */
export const packageIdFor = (plan: SubscriptionPlan, pricing: PlanPricingMap) =>
  pricing[plan]?.packageId ?? DEFAULT_PACKAGE_IDS[plan];
