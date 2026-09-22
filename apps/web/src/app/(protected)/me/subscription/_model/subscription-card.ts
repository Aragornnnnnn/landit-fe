// 구독 관리 골드 카드의 문구 규칙 — 상태·플랜으로 제목을, 상태로 날짜 행을, 플랜으로 결제 금액 행을 만든다
import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import {
  findPlan,
  formatWon,
  YEARLY_LIST_PRICE,
} from '@/features/subscription/model/plans';
import {
  resolveChargedPrice,
  type PaidSubscriptionSummary,
} from '@/features/subscription/model/subscription-summary';

const STATUS_TITLE: Record<PaidSubscriptionSummary['kind'], string> = {
  trial: '무료 체험 중이에요',
  active: '프리미엄을 쓰고 있어요',
  canceled: '해지가 예약됐어요',
};

export interface CardRow {
  label: string;
  value: string;
  /** 지워서 보여줄 비교가 — 연간의 결제 금액 행만 */
  listPrice?: string;
}

// 갱신이 없는데 프리미엄이면 무료로 받은 기간이다 — 우리 상품엔 선결제가 없어 대시보드 프로모션 부여뿐이다
const isGranted = (summary: PaidSubscriptionSummary) =>
  summary.kind === 'active' && !summary.renews;

// 구독 중이고 플랜을 알면 "월간 프리미엄"처럼 플랜을 앞에 붙인다. 받은 기간은 체험과 같은 말로 부른다
export const toCardTitle = (summary: PaidSubscriptionSummary) => {
  if (isGranted(summary)) return STATUS_TITLE.trial;
  return summary.kind === 'active' && summary.plan
    ? `${findPlan(summary.plan).title} ${STATUS_TITLE.active}`
    : STATUS_TITLE[summary.kind];
};

// 무엇의 날짜인지가 상태마다 다르다. 체험은 첫 결제, 구독은 다음 결제, 그날로 끝나면 만료
export const toDateRow = (summary: PaidSubscriptionSummary): CardRow | null => {
  const date = summary.expiresAt
    ? formatSubscriptionDate(summary.expiresAt)
    : null;
  if (!date) return null;
  if (summary.kind === 'trial') return { label: '첫 결제일', value: date };
  if (summary.renews) return { label: '다음 결제일', value: date };
  // 갱신을 껐다고 말할 수 있는 건 해지 예약뿐이다. 프로모션으로 받은 기간은 갱신이 있던 적이 없다
  const suffix = summary.kind === 'canceled' ? ' · 자동 갱신 꺼짐' : '';
  return { label: '이용 만료일', value: `${date}${suffix}` };
};

// 갱신되는 구독만, 플랜을 알 때만. 연간은 월간으로 1년 낼 때 금액을 지운 옆에 혜택가로 보여준다 —
// 비교 기준이 내 결제액이 아니라 월간 12개월치라, 실제 금액이 와도 취소선 숫자는 그대로다
export const toAmountRow = (
  summary: PaidSubscriptionSummary,
): CardRow | null => {
  const { plan } = summary;
  if (!plan || !summary.renews) return null;
  return {
    label: summary.kind === 'trial' ? '첫 결제 금액' : '다음 결제 금액',
    value: formatWon(resolveChargedPrice(summary, plan)),
    listPrice: plan === 'yearly' ? formatWon(YEARLY_LIST_PRICE) : undefined,
  };
};
