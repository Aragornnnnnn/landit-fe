// 사유별 화면(②·③)의 문구와 카드 — 피그마 확정 플로우(정리 섹션 2373:329) 그대로.
// 화면은 여기서 돌려준 모양만 그린다. 플랜·체험·이름·기록 같은 분기는 전부 여기서 끝내고, 문구는 받은 번역 함수로 화면 언어에 맞춘다
import type {
  CancelStayDestination,
  StudyMethod,
  SubscriptionPlan,
} from '@landit/analytics';

import type { RewardView } from '@/features/reward/api/reward';
import {
  formatStorePrice,
  type StorePrice,
} from '@/features/subscription/lib/store-price';
import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import { formatWon } from '@/features/subscription/lib/won';
import type { PaidSubscriptionSummary } from '@/features/subscription/model/my-subscription/subscription-summary';
import { PLAN_LABEL_KEYS } from '@/features/subscription/model/product/plans';
import type { Locale } from '@/shared/i18n/locale';
import type { Translator } from '@/shared/i18n/translator';

import type { RetentionReason } from './cancel-flow';

/** 라벨 한 줄 + 값 한 줄. 가로 한 행(라벨 왼쪽·값 오른쪽)으로 그린다 */
export interface RowCard {
  kind: 'row';
  label: string;
  /** 라벨 아래 작은 보조 문구 — 연간의 "연 58,500원", 6개월의 "6개월 59,900원" */
  sublabel?: string;
  value: string;
}

/** 값이 크고 라벨이 아래 — 두 칸 나란히 */
export interface StatCard {
  kind: 'stat';
  items: { value: string; label: string }[];
}

/** 적어 준 글을 그대로 보여 주는 인용 카드 */
export interface QuoteCard {
  kind: 'quote';
  label: string;
  text: string;
}

export type RetentionCard = RowCard | StatCard | QuoteCard;

export interface RetentionContent {
  emoji: string;
  title: string;
  body: string[];
  cards: RetentionCard[];
  primary: { label: string; to: CancelStayDestination };
}

/** 대화 시작부터 표현 학습 완료까지 걸린 시간의 실측 중앙값(앰플리튜드, 2026-09). 문구와 카드가 같은 숫자를 쓴다 */
export const DAILY_STUDY_MINUTES = 7;
// 매일 학습 알림 시각은 문구(subscription.retention.reminderTimeLabel)에 있다 — 사용자별 설정이 없어 서버 푸시 시각을 그대로 적는다

type SubscriptionTranslator = Translator<'subscription'>;

const stayOf = (t: SubscriptionTranslator) => ({
  label: t('retention.stayButton'),
  to: 'manage' as const,
});

/** 환급을 쌓는 중인 사람이 걸어 둔 것 — 지금까지 쌓인 금액과 끝까지 채우면 받는 금액 */
export interface RefundStake {
  balanceWon: number;
  maximumWon: number;
}

/** 쌓는 중일 때만 — 끝났거나 결제를 확인하는 중이면 돌려받는 금액을 내세울 수 없다 */
export const refundStakeOf = (reward: RewardView | null): RefundStake | null =>
  reward?.state === 'ACTIVE' && reward.current
    ? {
        balanceWon: reward.current.balanceWon,
        maximumWon: reward.current.maximumWon,
      }
    : null;

interface RetentionContext {
  /** 문구를 고를 번역 함수와 날짜를 적을 화면 언어 */
  t: SubscriptionTranslator;
  locale: Locale;
  summary: PaidSubscriptionSummary;
  /** 환급을 쌓는 중이 아니면 null */
  stake: RefundStake | null;
  /** 마이페이지가 쓰는 이름 — 없으면 "게스트"(화면 언어) */
  nickname: string;
  /** 스트릭 달력의 누적 학습일. 아직 못 받았으면 null */
  totalActiveDays: number | null;
  /** "견습 마법사 Lv.3"처럼 완성된 레벨 문구. 수준을 모르면 null */
  levelLabel: string | null;
  otherText: string;
}

/** 하루 환산 요금 — 원화는 10원 단위(월 14,900 → 500, 연 58,500 → 160), 엔화는 1엔 단위로 반올림한다 */
export const dailyPrice = (price: StorePrice, days: number): StorePrice => {
  const unit = price.currency === 'KRW' ? 10 : 1;
  return {
    amount: Math.round(price.amount / days / unit) * unit,
    currency: price.currency,
  };
};

// 환급을 쌓는 중이면 하루 요금보다 돌려받는 금액이 가격 이야기의 답이다.
// 환급은 한국어 화면에만 있어 문구를 옮기지 않는다
const rewardPriceContent = (
  stake: RefundStake,
  t: SubscriptionTranslator,
): RetentionContent => ({
  emoji: '💸',
  title: '가격이 부담되셨군요',
  body: [
    // 최대액은 살 때 정해진 값이다 — 쉰 날이 있으면 다 못 받으니 "매일 하면 받는다"고 약속하지 않는다
    `최대 ${formatWon(stake.maximumWon)}까지 돌려받는 플랜이에요.`,
    '돌려받는 만큼 실제로 내는 금액이 줄어들어요.',
  ],
  cards: [
    {
      kind: 'row',
      label: '지금까지 쌓인 환급액',
      value: formatWon(stake.balanceWon),
    },
    { kind: 'row', label: '최대 환급액', value: formatWon(stake.maximumWon) },
  ],
  primary: stayOf(t),
});

const PLAN_DAYS: Record<SubscriptionPlan, number> = {
  monthly: 30,
  quarterly: 90,
  halfyear: 180,
  yearly: 365,
  // 이용권은 해지할 것이 없어 이 화면에 오지 않는다 — 아래 세 표의 pass는 타입을 채우는 값이다
  pass: 100,
};
// 하루 요금을 빗댄 문장 — 월간 500원·3개월 440원은 껌, 6개월 330원은 사탕 두 개, 연간 160원은 사탕 하나
const PLAN_TREAT_KEYS = {
  monthly: 'gumTreatBody',
  quarterly: 'gumTreatBody',
  halfyear: 'twoCandiesTreatBody',
  yearly: 'candyTreatBody',
  pass: 'gumTreatBody',
} as const satisfies Record<SubscriptionPlan, string>;
// 결제 금액 보조 문구 — 월간은 하루 요금 행만으로 충분해 달지 않는다
const PLAN_PRICE_KEYS = {
  monthly: null,
  quarterly: 'quarterlyPriceLabel',
  halfyear: 'halfyearPriceLabel',
  yearly: 'yearlyPriceLabel',
  pass: 'passPriceLabel',
} as const satisfies Record<SubscriptionPlan, string | null>;

const priceContent = ({
  t,
  locale,
  summary,
  stake,
}: RetentionContext): RetentionContent => {
  if (stake) return rewardPriceContent(stake, t);
  const { plan, price } = summary;
  // 플랜이나 실제 결제액을 모르면 숫자를 지어내지 않는다 — 문구도 카드도 없이
  if (!plan || price === null) {
    return {
      emoji: '💸',
      title: t('retention.priceTitle'),
      body: [t('retention.priceUnknownBody')],
      cards: [],
      primary: stayOf(t),
    };
  }
  const title = t(`plans.${PLAN_LABEL_KEYS[plan]}`);
  const daily = t('retention.dailyPriceLabel', {
    price: formatStorePrice(dailyPrice(price, PLAN_DAYS[plan])),
  });
  const priceKey = PLAN_PRICE_KEYS[plan];
  const firstCharge = firstChargeRow(summary, t, locale);
  return {
    emoji: '💸',
    title: t('retention.priceTitle'),
    body: [
      plan === 'monthly'
        ? t('retention.monthlyDailyBody', { daily })
        : t('retention.planDailyBody', { plan: title, daily }),
      t(`retention.${PLAN_TREAT_KEYS[plan]}`),
    ],
    cards: [
      {
        kind: 'row',
        label: t('retention.currentPlanLabel', { plan: title }),
        sublabel: priceKey
          ? t(`retention.${priceKey}`, { price: formatStorePrice(price) })
          : undefined,
        value: daily,
      },
      ...(firstCharge ? [firstCharge] : []),
    ],
    primary: stayOf(t),
  };
};

// 체험 중이면 아직 결제 전이다 — 언제부터 내는지 한 행 더
const firstChargeRow = (
  summary: PaidSubscriptionSummary,
  t: SubscriptionTranslator,
  locale: Locale,
): RowCard | null => {
  if (summary.kind !== 'trial' || !summary.expiresAt) return null;
  const date = formatSubscriptionDate(summary.expiresAt, locale);
  return date
    ? {
        kind: 'row',
        label: t('subscriptionCard.firstChargeLabel'),
        value: date,
      }
    : null;
};

const progressContent = ({
  t,
  nickname,
  totalActiveDays,
  levelLabel,
}: RetentionContext): RetentionContent => {
  const items = [
    ...(totalActiveDays !== null
      ? [
          {
            value: t('retention.activeDaysValueLabel', {
              days: totalActiveDays,
            }),
            label: t('retention.activeDaysLabel'),
          },
        ]
      : []),
    ...(levelLabel
      ? [{ value: levelLabel, label: t('retention.levelStatLabel') }]
      : []),
  ];
  return {
    emoji: '📈',
    title: t('retention.progressTitle'),
    body: [
      t('retention.progressBody', { nickname }),
      t('retention.progressTogetherBody'),
    ],
    // 보여줄 숫자가 하나도 없으면 카드 자체를 안 그린다 — 빈 칸은 기죽이기만 한다
    cards: items.length > 0 ? [{ kind: 'stat', items }] : [],
    primary: stayOf(t),
  };
};

const timeContent = (t: SubscriptionTranslator): RetentionContent => ({
  emoji: '⏰',
  title: t('retention.timeTitle'),
  body: [
    t('retention.timeMinutesBody', { minutes: DAILY_STUDY_MINUTES }),
    t('retention.timeCoverBody'),
    t('retention.timeReminderBody'),
  ],
  cards: [
    {
      kind: 'row',
      label: t('retention.averageTimeLabel'),
      value: t('retention.minutesValueLabel', { minutes: DAILY_STUDY_MINUTES }),
    },
    {
      kind: 'row',
      label: t('retention.reminderLabel'),
      value: t('retention.reminderTimeLabel'),
    },
  ],
  primary: stayOf(t),
});

const contentContent = (t: SubscriptionTranslator): RetentionContent => ({
  emoji: '🗂️',
  title: t('retention.contentTitle'),
  body: [t('retention.readAndReplyBody'), t('retention.contentScenarioBody')],
  cards: [
    {
      kind: 'row',
      label: t('retention.mailboxLabel'),
      value: t('retention.contentMailboxLabel'),
    },
  ],
  primary: { label: t('retention.contentButton'), to: 'mailbox' },
});

const bugContent = (t: SubscriptionTranslator): RetentionContent => ({
  emoji: '🐞',
  title: t('retention.bugTitle'),
  body: [t('retention.readAndReplyBody'), t('retention.bugFixBody')],
  cards: [
    {
      kind: 'row',
      label: t('retention.mailboxLabel'),
      value: t('retention.bugMailboxLabel'),
    },
  ],
  primary: { label: t('retention.bugButton'), to: 'mailbox' },
});

const otherContent = ({
  t,
  otherText,
}: RetentionContext): RetentionContent => ({
  emoji: '✍️',
  title: t('retention.otherTitle'),
  body: [t('retention.otherReadBody'), t('retention.otherReplyBody')],
  cards: [
    {
      kind: 'quote',
      label: t('retention.otherQuoteLabel'),
      text: otherText.trim(),
    },
  ],
  primary: { label: t('retention.otherButton'), to: 'mailbox' },
});

/** ② 화면 — 사유 하나에 한 장. "다른 방법"은 ③으로 가므로 여기 없다 */
export const retentionContent = (
  reason: RetentionReason,
  context: RetentionContext,
): RetentionContent => {
  switch (reason) {
    case 'price':
      return priceContent(context);
    case 'progress':
      return progressContent(context);
    case 'other':
      return otherContent(context);
    case 'time':
      return timeContent(context.t);
    case 'content':
      return contentContent(context.t);
    case 'bug':
      return bugContent(context.t);
  }
};

// 방법마다 제목·첫 줄·둘째 줄 문구 키 — subscription.methodRetention 아래
const METHOD_CONTENT_KEYS = {
  academy: {
    title: 'academyTitle',
    first: 'academyBody',
    second: 'spokenStaysBody',
  },
  other_app: {
    title: 'otherAppTitle',
    first: 'otherAppBody',
    second: 'spokenStaysBody',
  },
  youtube: {
    title: 'youtubeTitle',
    first: 'youtubeBody',
    second: 'spokenStaysBody',
  },
  abroad: {
    title: 'abroadTitle',
    first: 'abroadBody',
    second: 'abroadStaysBody',
  },
} as const satisfies Record<
  StudyMethod,
  { title: string; first: string; second: string }
>;

/** ③ 화면 — 고른 방법마다 제목·첫 줄이 다르다. 카드는 없다 */
export const methodRetentionContent = (
  method: StudyMethod,
  t: SubscriptionTranslator,
): RetentionContent => {
  const { title, first, second } = METHOD_CONTENT_KEYS[method];
  return {
    emoji: '💬',
    title: t(`methodRetention.${title}`),
    body: [t(`methodRetention.${first}`), t(`methodRetention.${second}`)],
    cards: [],
    primary: stayOf(t),
  };
};
