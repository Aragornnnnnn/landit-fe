// 원화 표기와 판정 — 표기(formatWon)는 shared의 것을 그대로 내보내고, 판정(isWonCurrency)은 서버 금액용이다. 셸 가격 판정은 product/offering의 krwPackage

/** 서버 금액이 원화인가 — 통화가 안 오면 원화로 본다 */
export const isWonCurrency = (currency?: string | null) =>
  !currency || currency === 'KRW';

export { formatWon } from '@/shared/lib/won';
