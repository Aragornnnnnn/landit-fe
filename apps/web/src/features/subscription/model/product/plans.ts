// 지금 플랜(월간·연간)의 표시값 — 숫자는 여기 한 곳에만 둔다. 페이월 카드와 구독 관리의 결제 금액이 같이 쓴다 (docs/subscription.md 「상품과 가격」)
// 기본값은 스토어 등록값이고, 셸이 준 원화 가격이 있으면 buildPaywallPlans가 그 값으로 전부 다시 계산한다
import type { SubscriptionPlan } from '@landit/analytics';

import { formatWon } from '../../lib/won';

/** 지금 플랜 — 월간·연간. 환급 챌린지 플랜(3·6개월)은 페이월이 따로 그린다 */
export type RegularPlan = Extract<SubscriptionPlan, 'monthly' | 'yearly'>;

/** 카드 한 장에 그릴 값 전부. 큰 숫자는 실제 청구액이다 — 월 환산가가 더 눈에 띄면 스토어 심사 3.1.2(c)에서 반려된다 */
export interface PaywallPlan {
  id: RegularPlan;
  title: string;
  /** 청구 주기 — 큰 숫자 앞에 붙는다 */
  period: '월' | '연';
  /** 취소선으로 보여줄 비교가. 청구액과 같은 주기다. 비교 기준이 없는 카드(월간)는 비워 둔다 */
  listPrice?: number;
  /** 월 기준 금액. 연간은 연 결제액을 달로 나눈 환산값으로, 배지와 부제에만 쓴다 */
  monthlyPrice: number;
  /** 큰 숫자 — 실제 청구액. 스토어 등록값과 같아야 한다 (월간은 달마다, 연간은 해마다) */
  price: number;
  /** 카드 위 테두리에 걸치는 배지 문구. 할인을 강조하는 카드에만 단다 */
  badge?: string;
  subtitle: string;
}

/** 카드가 놓이는 순서 — 왼쪽 월간, 오른쪽 연간 */
export const PLAN_ORDER: readonly RegularPlan[] = ['monthly', 'yearly'];

export const DEFAULT_PLAN_ID: RegularPlan = 'yearly';

/** 플랜 이름 — 페이월 카드 제목과 구독 관리·결제 내역·해지 화면의 플랜 표기가 같이 쓴다 */
export const PLAN_TITLE: Record<SubscriptionPlan, string> = {
  monthly: '월간',
  yearly: '연간',
  quarterly: '3개월',
  halfyear: '6개월',
};

// 스토어 등록값 — 오퍼링을 못 받았을 때 페이월이 쓰는 폴백. 월간은 할인 없는 기본가라 비교선도 배지도 없다.
// 할인 연간(58,500)은 여기 없다 — 오퍼링으로만 오고, 못 받으면 시트를 띄우지 않으므로 폴백이 필요 없다
const MONTHLY_PRICE = 14_900;
const YEARLY_PRICE = 94_500;

/** 비교가 대비 판매가의 할인율. 정수 퍼센트로 반올림한다 */
export const calculateDiscountRate = (listPrice: number, price: number) =>
  Math.round((1 - price / listPrice) * 100);

/**
 * 연 결제액을 달로 나눈 값. 100원 단위로 올려 읽기 쉽게 한다 — 58,500원은 4,875원이라 월 4,900원.
 * 실제보다 낮게 보이면 기만이라 내림은 쓰지 않고, 실제 청구액(연 결제액)은 부제에 같이 적는다.
 */
export const calculateMonthlyEquivalent = (yearlyPrice: number) =>
  Math.ceil(yearlyPrice / 12 / 100) * 100;

/** 플랜별 실제 청구액. 비어 있는 플랜은 스토어 등록값을 쓴다 */
export type PlanPrices = Partial<Record<SubscriptionPlan, number>>;

/**
 * 실제 청구액 두 개로 카드 표시값 전부를 만든다 — 할인율·월 환산·부제가 한 산식에서 나와 서로 어긋나지 않는다.
 *
 * @param prices 셸이 준 원화 가격. 없는 플랜은 스토어 등록값
 */
export const buildPaywallPlans = (
  prices: PlanPrices = {},
): Record<RegularPlan, PaywallPlan> => {
  const monthlyPrice = prices.monthly ?? MONTHLY_PRICE;
  const yearlyPrice = prices.yearly ?? YEARLY_PRICE;
  const yearlyMonthly = calculateMonthlyEquivalent(yearlyPrice);

  return {
    monthly: {
      id: 'monthly',
      title: PLAN_TITLE.monthly,
      period: '월',
      monthlyPrice,
      price: monthlyPrice,
      subtitle: '매달 결제 · 언제든 해지',
    },
    yearly: {
      id: 'yearly',
      title: PLAN_TITLE.yearly,
      period: '연',
      // 연간의 비교 기준은 스토어에 없는 정가가 아니라 월간으로 1년 낼 때의 실제 금액이다
      listPrice: monthlyPrice * 12,
      monthlyPrice: yearlyMonthly,
      price: yearlyPrice,
      badge: `월간보다 ${calculateDiscountRate(monthlyPrice, yearlyMonthly)}% 저렴`,
      subtitle: `월 ${formatWon(yearlyMonthly)}꼴 · 7일 무료 체험`,
    },
  };
};

// 월간으로 1년을 낼 때 금액 — 연간 결제액의 비교 기준. 스토어에 없는 정가를 지어내지 않고 실제 월간 금액으로 잰다
export const YEARLY_LIST_PRICE = MONTHLY_PRICE * 12;

// 스토어 상품 식별자 → 플랜 (docs/subscription.md 「상품과 가격」).
// 연간은 정가와 이탈 할인 둘이라 같은 플랜을 가리키는 id가 두 개다. 3·6개월은 환급 챌린지 상품이다
const PRODUCT_PLANS: Record<string, SubscriptionPlan> = {
  'com.saynow.app.premium.monthly': 'monthly',
  'com.saynow.app.premium.yearly': 'yearly',
  'com.saynow.app.premium.yearly.discount': 'yearly',
  'com.saynow.app.premium.quarterly': 'quarterly',
  'com.saynow.app.premium.halfyear': 'halfyear',
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
