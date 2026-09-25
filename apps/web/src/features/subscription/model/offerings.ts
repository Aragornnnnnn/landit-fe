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

// 구독 주기(ISO 8601) → 플랜. 셸이 예약 식별자로 알아보지 못한 패키지는 여기서 갈린다.
// 새 주기를 팔기로 하면 이 표만 늘리면 되고 앱은 다시 내지 않아도 된다
const PLAN_BY_PERIOD: Partial<Record<string, SubscriptionPlan>> = {
  P1M: 'monthly',
  P1Y: 'yearly',
};

/** 셸이 예약 식별자($rc_monthly·$rc_annual)로 알아본 플랜 */
const reservedPlan = (pkg: OfferingPackage) => pkg.plan ?? undefined;

/** 상품의 구독 주기로 본 플랜 — 커스텀 이름이라 셸이 판단하지 못한 패키지가 여기로 온다 */
const periodPlan = (pkg: OfferingPackage) =>
  pkg.period ? PLAN_BY_PERIOD[pkg.period] : undefined;

/**
 * 셸 패키지 목록을 플랜별 가격표로 접는다.
 *
 * 예약 식별자가 먼저 자리를 잡고 남은 자리만 구독 주기로 채운다. 커스텀 이름 패키지가
 * 오퍼링 앞쪽에 놓여도 정가 자리를 가져가지 못하게 하려는 것이다 — 그 자리를 뺏기면
 * 화면이 그 가격을 그리고 그 패키지로 결제한다.
 *
 * 같은 방식으로 정해진 패키지가 둘이면 앞의 것 — 오퍼링 순서가 곧 우선순위다.
 * 어느 쪽으로도 못 정한 패키지는 건너뛴다 (`unclassifiablePackages`가 그걸 알린다).
 */
export const toPlanPricing = (packages: OfferingPackage[]): PlanPricingMap => {
  const map: PlanPricingMap = {};
  const fill = (
    resolve: (pkg: OfferingPackage) => SubscriptionPlan | undefined,
  ) => {
    for (const pkg of packages) {
      const plan = resolve(pkg);
      if (!plan || map[plan]) continue;
      map[plan] = {
        packageId: pkg.id,
        price: pkg.price,
        currency: pkg.currency,
      };
    }
  };
  fill(reservedPlan);
  // 예약 식별자로 이미 자리를 잡은 패키지는 주기 판정에서 뺀다 — 셸이 말한 플랜과 주기가
  // 어긋난 패키지(월간 칸에 1년 상품)가 두 자리를 다 차지하면 두 플랜이 같은 상품을 결제한다
  fill((pkg) => (reservedPlan(pkg) ? undefined : periodPlan(pkg)));
  return map;
};

/**
 * 월간·연간 어느 쪽으로도 볼 수 없는 패키지들.
 *
 * 이런 패키지는 가격표에서 조용히 빠지고, 할인 패키지가 그렇게 되면 시트가 뜨지 않는 채로
 * 아무 흔적도 남지 않는다. 스토어 설정이 어긋났다는 신호라 부르는 쪽이 보고한다.
 */
export const unclassifiablePackages = (packages: OfferingPackage[]) =>
  packages.filter((pkg) => !reservedPlan(pkg) && !periodPlan(pkg));

/** 플랜별 가격표 두 벌 — 페이월이 쓰는 정가와 이탈 할인 시트가 쓰는 할인가 */
export interface OfferingTiers {
  list: PlanPricingMap;
  promo: PlanPricingMap;
}

// RevenueCat 오퍼링에서 할인 패키지를 가리는 이름 규칙. 대시보드에서 `annual_discount`처럼 짓기로 했다 —
// 규칙을 어긋나게 지으면 정가로 분류돼 할인이 안 보일 뿐, 잘못된 금액으로 결제되지는 않는다
const DISCOUNT_SUFFIX = '_discount';

/**
 * 오퍼링을 정가·할인 두 벌로 가른다.
 *
 * 같은 플랜(연간)이 두 패키지로 오므로 한 표에 담을 수 없다. 화면은 자격에 따라 한 벌을 골라 쓰고,
 * `promo`가 비어 있으면 할인 UI를 띄우지 않는다 — 스토어 전파가 늦거나 한쪽 플랫폼만 물렸을 때다.
 */
export const toOfferingTiers = (
  packages: OfferingPackage[],
): OfferingTiers => ({
  list: toPlanPricing(packages.filter((pkg) => !isDiscount(pkg))),
  promo: toPlanPricing(packages.filter(isDiscount)),
});

const isDiscount = (pkg: OfferingPackage) => pkg.id.endsWith(DISCOUNT_SUFFIX);

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
