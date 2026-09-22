// 이탈 할인 시트가 그릴 숫자 — 스토어가 준 가격으로 할인율·월 환산·결제할 패키지를 정한다.
// 등록값 상수를 섞지 않는다. 화면에 보인 금액과 청구 금액이 어긋나면 안 되는 자리다
import {
  DEFAULT_PACKAGE_IDS,
  type OfferingTiers,
  type PlanPricing,
} from './offerings';
import {
  calculateDiscountRate,
  calculateMonthlyEquivalent,
  findPlan,
} from './plans';

const MONTHS_IN_YEAR = 12;

/** 시트의 연간 카드 — 할인가와, 정가를 알 때만 붙는 비교선 */
export interface PromoYearly {
  packageId: string;
  /** 연 결제액 */
  price: number;
  /** 연 정가 */
  listPrice: number | null;
  /** 월 환산 할인가 */
  monthlyPrice: number;
  /** 월 환산 정가. 정가 연간을 못 받았으면 null */
  monthlyListPrice: number | null;
  /** 정가 대비 할인율(%). 0 이하면 시트를 만들지 않으므로 늘 양수다 */
  discountRate: number;
}

/** 시트의 월간 카드 — 할인이 없어 정가 그대로다 */
export interface PromoMonthly {
  packageId: string;
  /** 월 결제액 */
  price: number;
  /** 1년치 환산액. 연간 카드와 같은 자로 재야 얼마나 싼지 읽힌다 */
  yearlyEquivalent: number;
}

export interface PromoSheet {
  yearly: PromoYearly;
  monthly: PromoMonthly;
}

// 원화 가격만 다룬다 — 화면 숫자가 「원」 표기와 100원 단위 환산을 전제로 짜여 있다.
// 다른 통화는 그대로 그리면 "월 100원" 같은 값이 나온다 (해외 스토어프런트는 다음 이슈)
const krwPrice = (pricing?: PlanPricing) =>
  pricing && pricing.currency === 'KRW' ? pricing : undefined;

/**
 * 시트에 그릴 값을 만든다.
 *
 * null이면 화면은 시트를 아예 띄우지 않는다. 세 경우다.
 * 할인 패키지가 없거나(스토어 전파 지연·한쪽 플랫폼만 물림), 원화가 아니거나,
 * 정가와 같아 깎이는 게 없을 때. 할인이 아닌 것을 할인이라 부르지 않는다.
 */
export const buildPromoSheet = ({
  list,
  promo,
}: OfferingTiers): PromoSheet | null => {
  const discounted = krwPrice(promo.yearly);
  const listYearly = krwPrice(list.yearly);
  if (!discounted) return null;

  const monthlyPrice = calculateMonthlyEquivalent(discounted.price);
  // 비교선은 스토어가 준 정가로만 긋는다. 등록값으로 대신하면 인상 전후에 거짓 할인율이 나온다
  const monthlyListPrice = listYearly
    ? calculateMonthlyEquivalent(listYearly.price)
    : null;
  const discountRate = monthlyListPrice
    ? calculateDiscountRate(monthlyListPrice, monthlyPrice)
    : 0;
  // 깎이는 게 없으면 시트를 띄우지 않는다 — 정가 인상 전에 오퍼링에 먼저 넣어 둬도 아무 일이 없다
  if (discountRate <= 0) return null;

  const listMonthly = krwPrice(list.monthly);
  const monthlyPlan = {
    packageId: listMonthly?.packageId ?? DEFAULT_PACKAGE_IDS.monthly,
    price: listMonthly?.price ?? findPlan('monthly').price,
  };

  return {
    yearly: {
      packageId: discounted.packageId,
      price: discounted.price,
      listPrice: listYearly?.price ?? null,
      monthlyPrice,
      monthlyListPrice,
      discountRate,
    },
    // 월간은 페이월과 같은 폴백을 쓴다 — 못 받으면 등록값 표시에 표준 패키지로 결제한다
    monthly: {
      ...monthlyPlan,
      yearlyEquivalent: monthlyPlan.price * MONTHS_IN_YEAR,
    },
  };
};
