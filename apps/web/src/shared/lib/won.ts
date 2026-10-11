// 원화 표기 — 금액을 보여 주는 모든 화면이 같은 모양으로 적는다

/** 천 단위 쉼표와 '원' — 14900 → 14,900원 */
export const formatWon = (amount: number) =>
  `${amount.toLocaleString('ko-KR')}원`;
