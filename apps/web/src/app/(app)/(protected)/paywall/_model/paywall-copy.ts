// 고른 플랜에 따라 갈리는 문구 — 연간과 월간은 청구 주기와 금액이 달라 CTA가 달라진다. 무료 체험은 없다
import { formatPrice } from '@/features/subscription/lib/store-price';
import { type PaywallPlan } from '@/features/subscription/model/product/plans';
import type { Translator } from '@/shared/i18n/translator';

type CheckoutTranslator = Translator<'paywall'>;

const priceOf = (plan: PaywallPlan) => formatPrice(plan.price, plan.currency);

/** CTA 문구. 실제 청구액을 앞세운다 — 연간은 연 결제액, 월간은 월 결제액 */
export const getCtaLabel = (plan: PaywallPlan, t: CheckoutTranslator) =>
  t(plan.id === 'yearly' ? 'yearlyStartButton' : 'monthlyStartButton', {
    price: priceOf(plan),
  });
