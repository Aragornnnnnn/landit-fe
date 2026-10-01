// 원화 표기와 판정 — 표기(formatWon)는 모든 화면이 같이 쓰고, 판정(isWonCurrency)은 서버 금액용이다. 셸 가격 판정은 product/offering의 krwPackage

/** 서버 금액이 원화인가 — 통화가 안 오면 원화로 본다 */
export const isWonCurrency = (currency?: string | null) =>
  !currency || currency === 'KRW';

/** 천 단위 쉼표와 '원' — 14900 → 14,900원 */
export const formatWon = (amount: number) =>
  `${amount.toLocaleString('ko-KR')}원`;
