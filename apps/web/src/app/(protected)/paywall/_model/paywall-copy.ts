// 고른 플랜에 따라 갈리는 문구 — 연간에만 무료 체험이 있어 CTA와 결제 안내가 달라진다
import {
  formatWon,
  type PaywallPlan,
} from '@/features/subscription/model/plans';

/** CTA 문구. 연간은 무료 체험을, 월간은 월 결제액을 앞세운다 */
export const getCtaLabel = (plan: PaywallPlan) =>
  plan.id === 'yearly'
    ? '7일 무료 체험 시작하기'
    : `월 ${formatWon(plan.price)}으로 시작하기`;

/** CTA 아래 결제 안내. 자동 갱신 금액과 해지 가능은 스토어 심사가 화면에서 확인하는 항목이라 항상 붙인다 */
export const getBillingNotice = (plan: PaywallPlan) =>
  plan.id === 'yearly'
    ? `7일 무료 체험 후 연 ${formatWon(plan.price)} 정기 결제 · 언제든 해지 가능`
    : `매월 ${formatWon(plan.price)} 정기 결제 · 언제든 해지 가능`;

/** 체험이 있는 플랜에만 붙는 둘째 줄 — 언제까지 해지해야 청구가 없는지. 스토어가 체험 24시간 전 갱신을 잠근다 */
export const getTrialNotice = (plan: PaywallPlan) =>
  plan.id === 'yearly'
    ? '체험 종료 24시간 전까지 해지하면 청구되지 않아요'
    : null;
