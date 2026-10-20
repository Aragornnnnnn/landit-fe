// 100일 이용권 정가와 할인율 — 신규 회원 특가로 결제가의 두 배를 정가로 지워 보여 준다

/** 정가 — 결제가의 두 배. 결제가를 셸이 주는 대로 따라가 가격 실험을 해도 반값이 유지된다 */
export const listPriceOf = (price: number) => price * 2;

/** 정가 대비 깎인 비율(%). 내림한다 — 실제보다 크게 깎아 준다고 말하지 않는다 */
export const discountPercentOf = (price: number, listPrice: number) =>
  Math.floor(((listPrice - price) / listPrice) * 100);
