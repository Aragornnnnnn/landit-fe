// 구독 관리 골드 카드의 문구 규칙 — 상태·플랜으로 제목을, 상태로 날짜 행을, 플랜으로 결제 금액 행을 만든다. 문구는 화면 언어로 붙인다
import { formatStorePrice } from '@/features/subscription/lib/store-price';
import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import { formatWon } from '@/features/subscription/lib/won';
import type { PaidSubscriptionSummary } from '@/features/subscription/model/my-subscription/subscription-summary';
import {
  PLAN_LABEL_KEYS,
  YEARLY_LIST_PRICE,
} from '@/features/subscription/model/product/plans';
import type { Locale } from '@/shared/i18n/locale';
import type { Translator } from '@/shared/i18n/translator';

type SubscriptionTranslator = Translator<'subscription'>;

const STATUS_TITLE_KEYS = {
  trial: 'trialTitle',
  active: 'activeTitle',
  canceled: 'canceledTitle',
} as const satisfies Record<PaidSubscriptionSummary['kind'], string>;

export interface CardRow {
  label: string;
  value: string;
  /** 지워서 보여줄 비교가 — 연간의 결제 금액 행만 */
  listPrice?: string;
}

// 갱신이 없는데 프리미엄이면 무료로 받은 기간이다 — 돈을 내고 산 100일 이용권만 빼면 대시보드 프로모션 부여뿐이다
const isGranted = (summary: PaidSubscriptionSummary) =>
  summary.kind === 'active' && !summary.renews && summary.plan !== 'pass';

// 구독 중이고 플랜을 알면 "월간 프리미엄"처럼 플랜을 앞에 붙인다. 받은 기간은 체험과 같은 말로 부른다
export const toCardTitle = (
  summary: PaidSubscriptionSummary,
  t: SubscriptionTranslator,
) => {
  // 이용권은 이름이 곧 상품이라 "프리미엄"을 덧붙이지 않는다
  if (summary.plan === 'pass') return t('subscriptionCard.passTitle');
  if (isGranted(summary)) return t('subscriptionCard.trialTitle');
  return summary.kind === 'active' && summary.plan
    ? t('subscriptionCard.planActiveTitle', {
        plan: t(`plans.${PLAN_LABEL_KEYS[summary.plan]}`),
      })
    : t(`subscriptionCard.${STATUS_TITLE_KEYS[summary.kind]}`);
};

// 무엇의 날짜인지가 상태마다 다르다. 체험은 첫 결제, 구독은 다음 결제, 그날로 끝나면 만료
export const toDateRow = (
  summary: PaidSubscriptionSummary,
  t: SubscriptionTranslator,
  locale: Locale,
): CardRow | null => {
  const date = summary.expiresAt
    ? formatSubscriptionDate(summary.expiresAt, locale)
    : null;
  if (!date) return null;
  if (summary.kind === 'trial')
    return { label: t('subscriptionCard.firstChargeLabel'), value: date };
  if (summary.renews)
    return { label: t('subscriptionCard.nextChargeLabel'), value: date };
  // 갱신을 껐다고 말할 수 있는 건 해지 예약뿐이다. 프로모션으로 받은 기간은 갱신이 있던 적이 없다
  return {
    label: t('subscriptionCard.expiryLabel'),
    value:
      summary.kind === 'canceled'
        ? t('subscriptionCard.autoRenewOffLabel', { date })
        : date,
  };
};

// 갱신되는 구독이고 실제 결제액을 알 때만. 무료 체험 중이면 결제 이력이 없어 이 행이 없다 —
// 등록값으로 추측하면 할인가나 옛 가격으로 묶인 사람에게 남의 금액을 보여준다.
// 연간의 비교 기준은 내 결제액이 아니라 월간 12개월치라, 실제 금액이 와도 취소선 숫자는 그대로다
export const toAmountRow = (
  summary: PaidSubscriptionSummary,
  t: SubscriptionTranslator,
): CardRow | null => {
  const { plan, price } = summary;
  if (!plan || !summary.renews || price === null) return null;
  return {
    label: t(
      summary.kind === 'trial'
        ? 'subscriptionCard.firstAmountLabel'
        : 'subscriptionCard.nextAmountLabel',
    ),
    value: formatStorePrice(price),
    // 비교가(월간 1년치)는 원화 정가라 원화 구독에만 붙인다
    listPrice:
      plan === 'yearly' && price.currency === 'KRW'
        ? formatWon(YEARLY_LIST_PRICE)
        : undefined,
  };
};
