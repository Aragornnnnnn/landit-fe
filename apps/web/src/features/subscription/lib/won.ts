// 원화 표기와 판정 — 페이월·할인 시트·구독 관리·결제 내역이 금액을 같은 모양으로 쓴다

/** 서버 금액이 원화인가 — 통화가 안 오면 원화로 본다 */
export const isWonCurrency = (currency?: string | null) =>
  !currency || currency === 'KRW';

/** 천 단위 쉼표와 '원' — 14900 → 14,900원 */
export const formatWon = (amount: number) =>
  `${amount.toLocaleString('ko-KR')}원`;
