// 고른 플랜에 따라 갈리는 문구 — 지금 플랜은 연간에만 무료 체험이 있어 CTA와 결제 안내가 달라지고, 환급 챌린지가 켜지면 환급 플랜 문구를 쓴다
import {
  formatWon,
  type PaywallPlan,
} from '@/features/subscription/model/plans';

import { getMaxRefund, REFUND_PLANS } from './paywall-content';

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

/** 둘째 줄 — 언제까지 해지해야 다음 청구가 없는지. 스토어는 기간이 끝나기 24시간 전에 갱신을 확정하므로 두 플랜 다 같은 규칙이다. 항상 두 줄이라 플랜을 오가도 CTA가 움직이지 않는다 */
export const getCancelNotice = (plan: PaywallPlan) =>
  plan.id === 'yearly'
    ? '체험 종료 24시간 전까지 해지하면 청구되지 않아요'
    : '결제일 24시간 전까지 해지하면 다음 달은 청구되지 않아요';

/** 환급 챌린지 CTA 문구 — 고른 환급 플랜의 기간과 환급률. 100%는 「전액」으로 말한다 */
export const getRefundCtaLabel = (plan: PaywallPlan) => {
  const { months, refundRate } = REFUND_PLANS[plan.id];
  return `${months}개월 ${refundRate === 100 ? '전액' : `${refundRate}%`} 환급 도전하기`;
};

/** 환급 챌린지 결제 안내 — 고른 환급 플랜의 결제 금액과 챌린지 성공 시 최대 환급액 */
export const getRefundBillingNotice = (plan: PaywallPlan) => {
  const { months, price } = REFUND_PLANS[plan.id];
  return `${months}개월 ${formatWon(price)} 결제 · 챌린지 성공하면 최대 ${formatWon(getMaxRefund(plan.id))} 환급`;
};
