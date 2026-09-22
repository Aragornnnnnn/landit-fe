// 이탈 할인 시트가 그릴 숫자 — 스토어가 준 가격으로 할인율·월 환산·결제할 패키지를 정한다.
// 등록값 상수를 섞지 않는다. 화면에 보인 금액과 청구 금액이 어긋나면 안 되는 자리다
import { DEFAULT_PACKAGE_IDS, type OfferingTiers } from './offerings';
import {
  calculateDiscountRate,
  calculateMonthlyEquivalent,
  findPlan,
} from './plans';

/** 시트의 연간 카드 — 할인가와, 정가를 알 때만 붙는 비교선 */
export interface PromoYearly {
  packageId: string;
  /** 연 결제액 */
  price: number;
  /** 월 환산 할인가 */
  monthlyPrice: number;
  /** 월 환산 정가. 정가 연간을 못 받았으면 null */
  monthlyListPrice: number | null;
  /** 정가 대비 할인율(%). 비교할 정가가 없으면 null */
  discountRate: number | null;
}

/** 시트의 월간 카드 — 할인이 없어 정가 그대로다 */
export interface PromoMonthly {
  packageId: string;
  price: number;
}

export interface PromoSheet {
  yearly: PromoYearly;
  monthly: PromoMonthly;
}

/**
 * 시트에 그릴 값을 만든다.
 *
 * 할인 연간 패키지가 없으면 null이다 — 스토어 전파가 늦거나 한쪽 플랫폼만 물렸을 때고,
 * 화면은 이 null을 보고 시트를 아예 띄우지 않는다. 할인가를 보여 놓고 정가로 결제되는 일이 없어야 한다.
 */
export const buildPromoSheet = ({
  list,
  promo,
}: OfferingTiers): PromoSheet | null => {
  const discounted = promo.yearly;
  if (!discounted) return null;

  const monthlyPrice = calculateMonthlyEquivalent(discounted.price);
  // 비교선은 스토어가 준 정가로만 긋는다. 등록값으로 대신하면 인상 전후에 거짓 할인율이 나온다
  const monthlyListPrice = list.yearly
    ? calculateMonthlyEquivalent(list.yearly.price)
    : null;

  return {
    yearly: {
      packageId: discounted.packageId,
      price: discounted.price,
      monthlyPrice,
      monthlyListPrice,
      discountRate: monthlyListPrice
        ? calculateDiscountRate(monthlyListPrice, monthlyPrice)
        : null,
    },
    // 월간은 페이월과 같은 폴백을 쓴다 — 못 받으면 등록값 표시에 표준 패키지로 결제한다
    monthly: {
      packageId: list.monthly?.packageId ?? DEFAULT_PACKAGE_IDS.monthly,
      price: list.monthly?.price ?? findPlan('monthly').price,
    },
  };
};
