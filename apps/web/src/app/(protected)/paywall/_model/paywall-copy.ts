// 고른 플랜에 따라 갈리는 문구 — 연간에만 무료 체험이 있어 CTA와 결제 안내가 달라진다
import { formatWon, type PaywallPlan } from './paywall-plans';

export const getCtaLabel = (plan: PaywallPlan) =>
  plan.id === 'yearly'
    ? '7일 무료 체험 시작하기'
    : `월 ${formatWon(plan.price)}으로 시작하기`;

// 자동 갱신 금액과 해지 가능은 스토어 심사가 화면에서 확인하는 항목이라 항상 붙인다
export const getBillingNotice = (plan: PaywallPlan) =>
  plan.id === 'yearly'
    ? `7일 무료 체험 후 연 ${formatWon(plan.price)} · 언제든 해지 가능`
    : `매월 ${formatWon(plan.price)} 자동 결제 · 언제든 해지 가능`;
