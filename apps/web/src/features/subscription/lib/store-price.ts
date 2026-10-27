// 스토어 가격 표기 — 구독·이용권 결제액을 스토어가 준 통화(원·엔)대로 적는다. 환급 금액은 늘 원화라 formatWon을 쓴다
import { formatWon } from '@/shared/lib/won';

/** 화면이 그릴 수 있는 스토어 통화. 다른 통화는 원화 등록값으로 돌아간다 */
export type PricedCurrency = 'KRW' | 'JPY';

const PRICED_CURRENCIES: readonly string[] = ['KRW', 'JPY'];

export const isPricedCurrency = (
  currency?: string | null,
): currency is PricedCurrency =>
  !!currency && PRICED_CURRENCIES.includes(currency);

/** 천 단위 쉼표에 통화 글자 — 14900 KRW → 14,900원, 1500 JPY → 1,500円 */
export const formatPrice = (amount: number, currency: PricedCurrency) =>
  currency === 'JPY'
    ? `${amount.toLocaleString('ja-JP')}円`
    : formatWon(amount);
