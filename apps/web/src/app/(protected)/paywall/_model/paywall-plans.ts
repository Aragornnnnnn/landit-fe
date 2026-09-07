// 페이월에 보여주는 두 플랜의 표시값 — 숫자는 여기 한 곳에만 둔다 (docs/subscription.md 「상품과 가격」)
// 기본값은 스토어 등록값이고, 셸이 준 오퍼링 가격이 있으면 buildPaywallPlans로 덮어쓴다
import type { SubscriptionPlan } from '@landit/analytics';

import type { PlanPricingMap } from '@/features/subscription/model/offerings';

export type PlanId = SubscriptionPlan;

export interface PaywallPlan {
  id: PlanId;
  title: string;
  // 카드는 두 플랜을 같은 자로 재도록 월 기준으로 보여준다 — 큰 숫자는 월 금액, 비교 기준이 있는 카드만 취소선
  monthlyListPrice?: number;
  monthlyPrice: number;
  // 실제 청구액 — 스토어 등록값과 같아야 한다 (월간은 달마다, 연간은 해마다)
  price: number;
  // 카드 위 테두리에 걸치는 배지 문구. 할인을 강조하는 카드에만 단다
  badge?: string;
  subtitle: string;
}

// 스토어 등록값 (2026-09-07 재설정). 월간은 할인 없는 기본가라 비교선도 배지도 없다
const MONTHLY_PRICE = 14_900;
const YEARLY_PRICE = 58_500;

export const calculateDiscountRate = (listPrice: number, price: number) =>
  Math.round((1 - price / listPrice) * 100);

// 연 결제액을 달로 나눈 값. 100원 단위로 올려 읽기 쉽게 한다 — 58,500원은 4,875원이라 월 4,900원.
// 실제보다 낮게 보이면 기만이라 내림은 쓰지 않고, 실제 청구액(연 결제액)은 부제에 같이 적는다
export const calculateMonthlyEquivalent = (yearlyPrice: number) =>
  Math.ceil(yearlyPrice / 12 / 100) * 100;

export const formatWon = (amount: number) =>
  `${amount.toLocaleString('ko-KR')}원`;

export interface PlanPrices {
  monthly?: number;
  yearly?: number;
}

// 실제 청구액 두 개로 카드 표시값 전부를 만든다 — 할인율·월 환산·부제가 여기서 파생돼 숫자가 서로 어긋나지 않는다
export const buildPaywallPlans = (prices: PlanPrices = {}): PaywallPlan[] => {
  const monthlyPrice = prices.monthly ?? MONTHLY_PRICE;
  const yearlyPrice = prices.yearly ?? YEARLY_PRICE;
  const yearlyMonthly = calculateMonthlyEquivalent(yearlyPrice);

  return [
    {
      id: 'monthly',
      title: '월간',
      monthlyPrice,
      price: monthlyPrice,
      subtitle: '매달 결제 · 언제든 해지',
    },
    {
      id: 'yearly',
      title: '연간',
      // 연간의 비교 기준은 스토어에 없는 정가가 아니라 월간으로 낼 때의 실제 월 금액이다
      monthlyListPrice: monthlyPrice,
      monthlyPrice: yearlyMonthly,
      price: yearlyPrice,
      badge: `월간보다 ${calculateDiscountRate(monthlyPrice, yearlyMonthly)}% 저렴`,
      subtitle: `연 ${formatWon(yearlyPrice)} · 7일 무료 체험`,
    },
  ];
};

// 셸이 준 스토어 가격표에서 원화 금액만 뽑는다 — 다른 통화는 월 환산·할인율 산식이 맞지 않아 기본값을 둔다
export const toPlanPrices = (pricing: PlanPricingMap): PlanPrices => ({
  monthly:
    pricing.monthly?.currency === 'KRW' ? pricing.monthly.price : undefined,
  yearly: pricing.yearly?.currency === 'KRW' ? pricing.yearly.price : undefined,
});

export const PAYWALL_PLANS = buildPaywallPlans();
export const [MONTHLY_PLAN, YEARLY_PLAN] = PAYWALL_PLANS;

export const DEFAULT_PLAN_ID: PlanId = 'yearly';
