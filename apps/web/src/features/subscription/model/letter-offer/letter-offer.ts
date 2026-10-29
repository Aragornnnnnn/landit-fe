// 편지 혜택가 — 환경변수로 지정한 편지에서만 할인 연간을 판다. 숫자는 스토어가 준 값만 쓴다
import {
  krwPackage,
  type Offering,
  type PlanPackage,
} from '../product/offering';
import {
  calculateDiscountRate,
  calculateMonthlyEquivalent,
} from '../product/plans';

/**
 * 혜택가를 보여줄 편지인가.
 *
 * dev·실서버의 편지 id가 달라 코드가 아니라 env에 둔다. 여러 통이면 쉼표로 이어 적는다.
 */
export const isOfferLetter = (
  letterId: number,
  configured = process.env.NEXT_PUBLIC_OFFER_LETTER_ID,
) =>
  !!configured &&
  configured
    .split(',')
    .map((id) => id.trim())
    // 빈칸을 Number로 바꾸면 0이 된다 — 끝에 붙은 쉼표 하나로 엉뚱한 편지에 버튼이 붙지 않게
    .filter((id) => id !== '')
    .map(Number)
    .includes(letterId);

/** 시트의 연간 카드 한 장 */
export interface LetterOffer {
  /** 연 결제액 — 할인 연간 */
  price: number;
  /** 월 환산 혜택가 */
  monthlyPrice: number;
  /** 취소선으로 보여줄 정가 연간. 못 받았거나 할인가보다 비싸지 않으면 null */
  listPrice: number | null;
  /** 정가 연간 대비 할인율(%). 비교가가 없으면 null */
  discountRate: number | null;
  /** 결제할 패키지 — 할인 연간 하나뿐이다 */
  packages: { yearly: PlanPackage };
}

/**
 * 시트에 그릴 값을 만든다.
 *
 * @returns null이면 버튼을 그리지 않는다 — 할인 패키지를 못 받았거나 원화가 아닐 때다.
 *   이때 결제하면 `packageIdFor`가 표준 패키지(연간은 할인 패키지 `annual_discount`)로 떨어진다
 */
export const buildLetterOffer = ({
  regular,
  promo,
}: Offering): LetterOffer | null => {
  const discounted = krwPackage(promo.yearly);
  if (!discounted) return null;

  const regularYearly = krwPackage(regular.yearly);
  const listPrice =
    regularYearly && regularYearly.price > discounted.price
      ? regularYearly.price
      : null;
  return {
    price: discounted.price,
    monthlyPrice: calculateMonthlyEquivalent(discounted.price),
    listPrice,
    discountRate:
      listPrice === null
        ? null
        : calculateDiscountRate(listPrice, discounted.price),
    packages: { yearly: discounted },
  };
};
