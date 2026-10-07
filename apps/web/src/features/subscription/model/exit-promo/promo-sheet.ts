// 이탈 할인 시트가 그릴 숫자 — 스토어가 준 가격으로 할인율·월 환산·결제할 패키지를 정한다.
// 등록값 상수를 섞지 않는다. 화면에 보인 금액과 청구 금액이 어긋나면 안 되는 자리다
import {
  krwPackage,
  type Offering,
  type PlanPackages,
} from '../product/offering';
import {
  calculateDiscountRate,
  calculateMonthlyEquivalent,
} from '../product/plans';

const MONTHS_IN_YEAR = 12;

/** 시트의 연간 카드 — 할인가와 월 환산 */
export interface PromoYearly {
  /** 연 결제액 */
  price: number;
  /** 월 환산 할인가 */
  monthlyPrice: number;
  /** 월간으로 1년 쓸 때 대비 할인율(%). 0 이하면 시트를 만들지 않으므로 늘 양수다 */
  discountRate: number;
}

/** 시트의 월간 카드 — 할인이 없어 정가 그대로다 */
export interface PromoMonthly {
  /** 월 결제액 */
  price: number;
  /** 월 결제액 × 12. 연간과 같은 1년 기준이어야 두 카드를 비교할 수 있다 */
  yearlyEquivalent: number;
}

/** 시트에 그릴 카드 두 장 */
export interface PromoSheet {
  yearly: PromoYearly;
  monthly: PromoMonthly;
  /** 결제할 패키지 — 연간은 할인, 월간은 정가 */
  packages: PlanPackages;
}

/**
 * 시트에 그릴 값을 만든다.
 *
 * 할인율은 월간을 1년 쓸 때의 금액(월 결제액 × 12)과 견줘 계산한다. 연간 정가와 견주면
 * 정가 인상 전에는 할인율이 0이 나온다.
 *
 * @returns 시트에 그릴 값. null이면 시트를 띄우지 않는다 — 할인 패키지나 비교할 월간
 *   가격을 못 받았을 때, 원화가 아닐 때, 계산한 할인율이 0 이하일 때다
 */
export const buildPromoSheet = ({
  regular,
  promo,
}: Offering): PromoSheet | null => {
  const discounted = krwPackage(promo.yearly);
  const regularYearly = krwPackage(regular.yearly);
  const regularMonthly = krwPackage(regular.monthly);
  if (!discounted || !regularMonthly) return null;

  // 정가 연간이 아직 할인가와 같다면 인상 전이다 — 오퍼링에 먼저 넣어 둬도 아무 일이 없다
  if (!regularYearly || regularYearly.price <= discounted.price) return null;

  const monthlyPrice = calculateMonthlyEquivalent(discounted.price);
  const discountRate = calculateDiscountRate(
    regularMonthly.price,
    monthlyPrice,
  );
  if (discountRate <= 0) return null;

  return {
    yearly: {
      price: discounted.price,
      monthlyPrice,
      discountRate,
    },
    monthly: {
      price: regularMonthly.price,
      yearlyEquivalent: regularMonthly.price * MONTHS_IN_YEAR,
    },
    packages: { yearly: discounted, monthly: regularMonthly },
  };
};

/**
 * 지금 이 사용자에게 할인을 보여줄 수 있는가.
 *
 * 페이월(이탈을 알릴지)·헤더(시트를 열지)·시트(그릴지)가 **같은 답**을 써야 한다.
 * 어긋나면 서버가 5분을 찍었는데 화면엔 아무것도 없는 상태가 생기고, 그 5분은 돌려받지 못한다.
 */
export const canShowPromo = (offering: Offering) =>
  buildPromoSheet(offering) !== null;
