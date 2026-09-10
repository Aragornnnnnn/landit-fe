// 두 플랜의 표시값 — 숫자는 여기 한 곳에만 둔다. 페이월 카드와 구독 관리의 플랜 변경 안내가 같이 쓴다 (docs/subscription.md 「상품과 가격」)
// 실제 청구액은 스토어가 정한다. 결제 연동(LAN-447) 뒤에는 카드의 가격 문자열을 오퍼링 값으로 갈아 끼운다
import type { SubscriptionPlan } from '@landit/analytics';

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

export const MONTHLY_PLAN: PaywallPlan = {
  id: 'monthly',
  title: '월간',
  monthlyPrice: MONTHLY_PRICE,
  price: MONTHLY_PRICE,
  subtitle: '매달 결제 · 언제든 해지',
};

// 연간의 비교 기준은 스토어에 없는 정가가 아니라 월간으로 낼 때의 실제 월 금액이다
const YEARLY_MONTHLY_PRICE = calculateMonthlyEquivalent(YEARLY_PRICE);

export const YEARLY_PLAN: PaywallPlan = {
  id: 'yearly',
  title: '연간',
  monthlyListPrice: MONTHLY_PRICE,
  monthlyPrice: YEARLY_MONTHLY_PRICE,
  price: YEARLY_PRICE,
  badge: `월간보다 ${calculateDiscountRate(MONTHLY_PRICE, YEARLY_MONTHLY_PRICE)}% 저렴`,
  subtitle: `연 ${formatWon(YEARLY_PRICE)} · 7일 무료 체험`,
};

export const PAYWALL_PLANS: PaywallPlan[] = [MONTHLY_PLAN, YEARLY_PLAN];

export const DEFAULT_PLAN_ID: PlanId = 'yearly';

export const findPlan = (id: PlanId): PaywallPlan =>
  id === 'monthly' ? MONTHLY_PLAN : YEARLY_PLAN;
