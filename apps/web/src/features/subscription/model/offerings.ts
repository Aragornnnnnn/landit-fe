// 셸이 준 오퍼링(패키지 목록)을 플랜별 가격표로 바꾼다 — 화면은 이걸로 표시값을 덮어쓰고, 결제 요청에 packageId를 쓴다
import type { OfferingPackage, SubscriptionPlan } from '@landit/bridge';

export interface PlanPricing {
  packageId: string;
  price: number;
  currency: string;
}

export type PlanPricingMap = Partial<Record<SubscriptionPlan, PlanPricing>>;

export const toPlanPricing = (packages: OfferingPackage[]): PlanPricingMap => {
  const map: PlanPricingMap = {};
  for (const pkg of packages) {
    // 같은 플랜이 둘이면 앞의 것 — 오퍼링 순서가 곧 우선순위다
    if (map[pkg.plan]) continue;
    map[pkg.plan] = {
      packageId: pkg.id,
      price: pkg.price,
      currency: pkg.currency,
    };
  }
  return map;
};

// 오퍼링을 못 받았을 때 결제에 쓸 RevenueCat 표준 패키지 identifier — 셸이 identifier로 패키지를 찾는다
export const DEFAULT_PACKAGE_IDS: Record<SubscriptionPlan, string> = {
  monthly: '$rc_monthly',
  yearly: '$rc_annual',
};

export const packageIdFor = (plan: SubscriptionPlan, pricing: PlanPricingMap) =>
  pricing[plan]?.packageId ?? DEFAULT_PACKAGE_IDS[plan];
