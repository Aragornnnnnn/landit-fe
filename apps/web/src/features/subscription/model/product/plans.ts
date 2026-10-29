// 지금 플랜(월간·연간)의 표시값 — 숫자는 여기 한 곳에만 둔다. 페이월 카드와 구독 관리의 결제 금액이 같이 쓴다 (docs/subscription.md 「상품과 가격」)
// 기본값은 스토어 등록값(원화)이고, 셸이 준 가격(원·엔)이 있으면 buildPaywallPlans가 그 값으로 전부 다시 계산한다
import type { SubscriptionPlan } from '@landit/analytics';

import { type PricedCurrency } from '../../lib/store-price';

/** 지금 플랜 — 월간·연간. 환급 챌린지의 100일 이용권은 페이월이 따로 그린다 */
export type RegularPlan = Extract<SubscriptionPlan, 'monthly' | 'yearly'>;

/** 카드 한 장에 그릴 값 전부. 문구는 화면이 언어대로 붙인다. 큰 숫자는 실제 청구액이다 — 월 환산가가 더 눈에 띄면 스토어 심사 3.1.2(c)에서 반려된다 */
export interface PaywallPlan {
  id: RegularPlan;
  /** 금액들의 통화 — 스토어가 준 통화이고, 못 받았으면 원화 등록값이다 */
  currency: PricedCurrency;
  /** 취소선으로 보여줄 비교가. 청구액과 같은 주기다. 비교 기준이 없는 카드(월간)는 비워 둔다 */
  listPrice?: number;
  /** 월 기준 금액. 연간은 연 결제액을 달로 나눈 환산값으로, 배지와 부제에만 쓴다 */
  monthlyPrice: number;
  /** 큰 숫자 — 실제 청구액. 스토어 등록값과 같아야 한다 (월간은 달마다, 연간은 해마다) */
  price: number;
  /** 카드 위 테두리 배지의 할인율(%). 할인을 강조하는 카드에만 있다 */
  discountRate?: number;
}

/** 카드가 놓이는 순서 — 왼쪽 월간, 오른쪽 연간 */
export const PLAN_ORDER: readonly RegularPlan[] = ['monthly', 'yearly'];

export const DEFAULT_PLAN_ID: RegularPlan = 'yearly';

/** 플랜 이름 문구 키 — subscription.plans 아래. 구독 관리·결제 내역이 화면 언어로 그린다 */
export const PLAN_LABEL_KEYS = {
  monthly: 'monthlyLabel',
  yearly: 'yearlyLabel',
  quarterly: 'quarterlyLabel',
  halfyear: 'halfyearLabel',
  pass: 'passLabel',
} as const satisfies Record<SubscriptionPlan, string>;

// 스토어 등록값 — 오퍼링을 받기 전이나 셸이 없을 때 페이월이 쓰는 폴백. 월간은 할인 없는 기본가라 비교선도 배지도 없다.
// 연간은 지금 파는 할인 연간(58,500)이다 — 정가 연간(94,500)은 더는 팔지 않는다
const MONTHLY_PRICE = 14_900;
const YEARLY_PRICE = 58_500;

/** 비교가 대비 판매가의 할인율. 정수 퍼센트로 반올림한다 */
export const calculateDiscountRate = (listPrice: number, price: number) =>
  Math.round((1 - price / listPrice) * 100);

// 월 환산 올림 단위 — 원화는 100원, 엔화는 10엔. 어느 쪽이든 끝자리가 둥글게 읽힌다
const MONTHLY_ROUNDING: Record<PricedCurrency, number> = { KRW: 100, JPY: 10 };

/**
 * 연 결제액을 달로 나눈 값. 통화별 단위로 올려 읽기 쉽게 한다 — 58,500원은 4,875원이라 월 4,900원, 5,800円은 483円이라 월 490円.
 * 실제보다 낮게 보이면 기만이라 내림은 쓰지 않고, 실제 청구액(연 결제액)은 부제에 같이 적는다.
 */
export const calculateMonthlyEquivalent = (
  yearlyPrice: number,
  currency: PricedCurrency = 'KRW',
) => {
  const unit = MONTHLY_ROUNDING[currency];
  return Math.ceil(yearlyPrice / 12 / unit) * unit;
};

/** 플랜별 실제 청구액. 비어 있는 플랜은 스토어 등록값을 쓴다 */
export type PlanPrices = Partial<Record<SubscriptionPlan, number>>;

/**
 * 실제 청구액 두 개로 카드 표시값 전부를 만든다 — 할인율·월 환산이 한 산식에서 나와 서로 어긋나지 않는다.
 *
 * @param prices 셸이 준 가격. 없는 플랜은 스토어 등록값(원화)
 * @param currency prices의 통화. 원화가 아니면 두 플랜 가격이 다 있어야 한다 — 등록값과 섞이면 안 된다 (toRegularPrices가 보장)
 */
export const buildPaywallPlans = (
  prices: PlanPrices = {},
  currency: PricedCurrency = 'KRW',
): Record<RegularPlan, PaywallPlan> => {
  const monthlyPrice = prices.monthly ?? MONTHLY_PRICE;
  const yearlyPrice = prices.yearly ?? YEARLY_PRICE;
  const yearlyMonthly = calculateMonthlyEquivalent(yearlyPrice, currency);

  return {
    monthly: {
      id: 'monthly',
      currency,
      monthlyPrice,
      price: monthlyPrice,
    },
    yearly: {
      id: 'yearly',
      currency,
      // 연간의 비교 기준은 스토어에 없는 정가가 아니라 월간으로 1년 낼 때의 실제 금액이다
      listPrice: monthlyPrice * 12,
      monthlyPrice: yearlyMonthly,
      price: yearlyPrice,
      discountRate: calculateDiscountRate(monthlyPrice, yearlyMonthly),
    },
  };
};

// 월간으로 1년을 낼 때 금액 — 연간 결제액의 비교 기준. 스토어에 없는 정가를 지어내지 않고 실제 월간 금액으로 잰다
export const YEARLY_LIST_PRICE = MONTHLY_PRICE * 12;

// 스토어 상품 식별자 → 플랜 (docs/subscription.md 「상품과 가격」).
// 연간은 정가와 이탈 할인 둘이라 같은 플랜을 가리키는 id가 두 개다. 3·6개월은 옛 환급 챌린지 상품이다
const PRODUCT_PLANS: Record<string, SubscriptionPlan> = {
  'com.saynow.app.premium.monthly': 'monthly',
  'com.saynow.app.premium.yearly': 'yearly',
  'com.saynow.app.premium.yearly.discount': 'yearly',
  'com.saynow.app.premium.quarterly': 'quarterly',
  'com.saynow.app.premium.halfyear': 'halfyear',
  // 100일 이용권 — 기간은 같고 가격만 다르다(가격 실험용)
  'com.saynow.app.pass.30000': 'pass',
  'com.saynow.app.pass.50000': 'pass',
  'com.saynow.app.pass.100000': 'pass',
  'com.saynow.app.pass.200000': 'pass',
};

/**
 * BE가 준 상품 식별자를 플랜으로.
 *
 * Play는 RevenueCat이 `상품ID:베이스플랜ID`로 주므로 콜론 앞만 본다.
 * 모르는 값(프로모션·옛 상품)은 null이고, 그러면 화면이 플랜을 말하지 않는다.
 */
export const planFromProductId = (
  productId: string | null | undefined,
): SubscriptionPlan | null =>
  PRODUCT_PLANS[(productId ?? '').split(':')[0]] ?? null;
