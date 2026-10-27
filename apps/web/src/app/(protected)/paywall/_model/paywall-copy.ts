// 고른 플랜에 따라 갈리는 문구 — 지금 플랜은 연간에만 무료 체험이 있어 CTA와 결제 안내가 달라진다
import type { useTranslations } from 'next-intl';

import { formatPrice } from '@/features/subscription/lib/store-price';
import { type PaywallPlan } from '@/features/subscription/model/product/plans';

type CheckoutTranslator = ReturnType<
  typeof useTranslations<'paywall.paywallCheckout'>
>;

const priceOf = (plan: PaywallPlan) => formatPrice(plan.price, plan.currency);

/** CTA 문구. 연간은 무료 체험을, 월간은 월 결제액을 앞세운다 */
export const getCtaLabel = (plan: PaywallPlan, t: CheckoutTranslator) =>
  plan.id === 'yearly'
    ? t('trialStartButton')
    : t('monthlyStartButton', { price: priceOf(plan) });

/** CTA 아래 결제 안내. 자동 갱신 금액과 해지 가능은 스토어 심사가 화면에서 확인하는 항목이라 항상 붙인다 */
export const getBillingNotice = (plan: PaywallPlan, t: CheckoutTranslator) =>
  t(plan.id === 'yearly' ? 'yearlyBillingCaption' : 'monthlyBillingCaption', {
    price: priceOf(plan),
  });

/** 둘째 줄 — 언제까지 해지해야 다음 청구가 없는지. 스토어는 기간이 끝나기 24시간 전에 갱신을 확정하므로 두 플랜 다 같은 규칙이다. 항상 두 줄이라 플랜을 오가도 CTA가 움직이지 않는다 */
export const getCancelNotice = (plan: PaywallPlan, t: CheckoutTranslator) =>
  t(plan.id === 'yearly' ? 'yearlyCancelCaption' : 'monthlyCancelCaption');
