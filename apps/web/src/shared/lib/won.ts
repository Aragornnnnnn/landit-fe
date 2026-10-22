// 원화 표기 — 금액을 보여 주는 모든 화면이 같은 모양으로 적는다

/** 천 단위 쉼표와 '원' — 14900 → 14,900원 */
export const formatWon = (amount: number) =>
  `${amount.toLocaleString('ko-KR')}원`;

/** 만 원 단위로 떨어지면 줄여 적는다 — 10000 → 1만원, 좁은 띠의 오른쪽 끝처럼 자리가 모자랄 때 */
export const formatWonShort = (amount: number) =>
  amount >= 10000 && amount % 10000 === 0
    ? `${amount / 10000}만원`
    : formatWon(amount);
