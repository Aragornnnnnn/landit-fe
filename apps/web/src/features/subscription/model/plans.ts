// 두 플랜의 표시값 — 숫자는 여기 한 곳에만 둔다. 페이월 카드와 구독 관리의 결제 금액이 같이 쓴다 (docs/subscription.md 「상품과 가격」)
// 기본값은 스토어 등록값이고, 셸이 준 원화 가격이 있으면 buildPaywallPlans가 그 값으로 전부 다시 계산한다
import type { SubscriptionPlan } from '@landit/analytics';

export type PlanId = SubscriptionPlan;

/** 카드 한 장에 그릴 값 전부. 두 카드는 같은 자로 재도록 월 기준 숫자를 쓴다 */
export interface PaywallPlan {
  id: PlanId;
  title: string;
  /** 취소선으로 보여줄 월 기준 비교가. 비교 기준이 없는 카드(월간)는 비워 둔다 */
  monthlyListPrice?: number;
  /** 큰 숫자 — 월 기준 금액. 연간은 연 결제액을 달로 나눈 환산값 */
  monthlyPrice: number;
  /** 실제 청구액 — 스토어 등록값과 같아야 한다 (월간은 달마다, 연간은 해마다) */
  price: number;
  /** 카드 위 테두리에 걸치는 배지 문구. 할인을 강조하는 카드에만 단다 */
  badge?: string;
  subtitle: string;
}

/** 카드가 놓이는 순서 — 왼쪽 월간, 오른쪽 연간 */
export const PLAN_ORDER: readonly PlanId[] = ['monthly', 'yearly'];

export const DEFAULT_PLAN_ID: PlanId = 'yearly';

// 스토어 등록값 (2026-09-07 재설정). 월간은 할인 없는 기본가라 비교선도 배지도 없다
const MONTHLY_PRICE = 14_900;
const YEARLY_PRICE = 58_500;

/** 비교가 대비 판매가의 할인율. 정수 퍼센트로 반올림한다 */
export const calculateDiscountRate = (listPrice: number, price: number) =>
  Math.round((1 - price / listPrice) * 100);

/**
 * 연 결제액을 달로 나눈 값. 100원 단위로 올려 읽기 쉽게 한다 — 58,500원은 4,875원이라 월 4,900원.
 * 실제보다 낮게 보이면 기만이라 내림은 쓰지 않고, 실제 청구액(연 결제액)은 부제에 같이 적는다.
 */
export const calculateMonthlyEquivalent = (yearlyPrice: number) =>
  Math.ceil(yearlyPrice / 12 / 100) * 100;

/** 천 단위 쉼표와 '원' — 14900 → 14,900원 */
export const formatWon = (amount: number) =>
  `${amount.toLocaleString('ko-KR')}원`;

/** 플랜별 실제 청구액. 비어 있는 플랜은 스토어 등록값을 쓴다 */
export type PlanPrices = Partial<Record<PlanId, number>>;

/**
 * 실제 청구액 두 개로 카드 표시값 전부를 만든다 — 할인율·월 환산·부제가 한 산식에서 나와 서로 어긋나지 않는다.
 *
 * @param prices 셸이 준 원화 가격. 없는 플랜은 스토어 등록값
 */
export const buildPaywallPlans = (
  prices: PlanPrices = {},
): Record<PlanId, PaywallPlan> => {
  const monthlyPrice = prices.monthly ?? MONTHLY_PRICE;
  const yearlyPrice = prices.yearly ?? YEARLY_PRICE;
  const yearlyMonthly = calculateMonthlyEquivalent(yearlyPrice);

  return {
    monthly: {
      id: 'monthly',
      title: '월간',
      monthlyPrice,
      price: monthlyPrice,
      subtitle: '매달 결제 · 언제든 해지',
    },
    yearly: {
      id: 'yearly',
      title: '연간',
      // 연간의 비교 기준은 스토어에 없는 정가가 아니라 월간으로 낼 때의 실제 월 금액이다
      monthlyListPrice: monthlyPrice,
      monthlyPrice: yearlyMonthly,
      price: yearlyPrice,
      badge: `월간보다 ${calculateDiscountRate(monthlyPrice, yearlyMonthly)}% 저렴`,
      subtitle: `연 ${formatWon(yearlyPrice)} · 7일 무료 체험`,
    },
  };
};

// 등록값 기준 플랜 하나 — 구독 관리처럼 스토어 가격 없이 그리는 곳. 페이월은 buildPaywallPlans(스토어 가격)를 쓴다
export const findPlan = (id: PlanId): PaywallPlan => buildPaywallPlans()[id];

// 월간으로 1년을 낼 때 금액 — 연간 결제액의 비교 기준. 스토어에 없는 정가를 지어내지 않고 실제 월간 금액으로 잰다
export const YEARLY_LIST_PRICE = MONTHLY_PRICE * 12;

// 스토어 상품 식별자 (docs/subscription.md 「상품과 가격」)
const PRODUCT_IDS: Record<PlanId, string> = {
  monthly: 'com.saynow.app.premium.monthly',
  yearly: 'com.saynow.app.premium.yearly',
};

// BE가 준 상품 식별자를 플랜으로. 모르는 값(프로모션·옛 상품)은 null
export const planFromProductId = (
  productId: string | null | undefined,
): PlanId | null =>
  PLAN_ORDER.find((id) => PRODUCT_IDS[id] === productId) ?? null;
