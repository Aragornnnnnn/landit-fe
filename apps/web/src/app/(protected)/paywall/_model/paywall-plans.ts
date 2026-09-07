// 페이월에 보여주는 두 플랜의 표시값 — 숫자는 여기 한 곳에만 둔다 (docs/subscription.md 「상품과 가격」)
// 실제 청구액은 스토어가 정한다. 결제 연동(LAN-447) 뒤에는 카드의 가격 문자열을 오퍼링 값으로 갈아 끼운다
import type { SubscriptionPlan } from '@landit/analytics';

export type PlanId = SubscriptionPlan;

export interface PaywallPlan {
  id: PlanId;
  title: string;
  // 카드는 두 플랜을 같은 자로 재도록 월 기준으로 보여준다 — 취소선(비교 기준)과 큰 숫자
  monthlyListPrice: number;
  monthlyPrice: number;
  // 실제 청구액 — 스토어 등록값과 같아야 한다 (월간은 달마다, 연간은 해마다)
  price: number;
  // 카드 위 테두리에 걸치는 배지 문구
  badge: string;
  subtitle: string;
}

// 스토어 등록값 (App Store Connect, 2026-09-04). 월간 정가 19,800원은 스토어에 없고 표시용이다
const MONTHLY_LIST_PRICE = 19_800;
const MONTHLY_PRICE = 9_900;
const YEARLY_PRICE = 59_900;

export const discountRate = (listPrice: number, price: number) =>
  Math.round((1 - price / listPrice) * 100);

// 연 결제액을 달로 나눈 값. 10원 단위로 내려 읽기 쉽게 한다 — 실제 청구액(연 결제액)은 부제에 같이 적는다
export const monthlyEquivalent = (yearlyPrice: number) =>
  Math.floor(yearlyPrice / 12 / 10) * 10;

export const formatWon = (amount: number) =>
  `${amount.toLocaleString('ko-KR')}원`;

export const MONTHLY_PLAN: PaywallPlan = {
  id: 'monthly',
  title: '월간',
  monthlyListPrice: MONTHLY_LIST_PRICE,
  monthlyPrice: MONTHLY_PRICE,
  price: MONTHLY_PRICE,
  badge: `출시 기념 ${discountRate(MONTHLY_LIST_PRICE, MONTHLY_PRICE)}%`,
  // 출시 기념가는 인트로 오퍼가 아니라 기본가라, 지금 가입한 사람은 그 금액이 계속 유지된다
  subtitle: '지금 시작하면 계속 이 가격',
};

// 연간의 비교 기준은 스토어에 없는 정가가 아니라 월간으로 낼 때의 실제 월 금액이다
const YEARLY_MONTHLY_PRICE = monthlyEquivalent(YEARLY_PRICE);

export const YEARLY_PLAN: PaywallPlan = {
  id: 'yearly',
  title: '연간',
  monthlyListPrice: MONTHLY_PRICE,
  monthlyPrice: YEARLY_MONTHLY_PRICE,
  price: YEARLY_PRICE,
  badge: `월간보다 ${discountRate(MONTHLY_PRICE, YEARLY_MONTHLY_PRICE)}% 저렴`,
  subtitle: `연 ${formatWon(YEARLY_PRICE)} · 7일 무료 체험`,
};

export const PAYWALL_PLANS: PaywallPlan[] = [MONTHLY_PLAN, YEARLY_PLAN];

export const DEFAULT_PLAN_ID: PlanId = 'yearly';

export const findPlan = (id: PlanId): PaywallPlan =>
  id === 'monthly' ? MONTHLY_PLAN : YEARLY_PLAN;
