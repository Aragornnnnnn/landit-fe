// 사유별 화면(②·③)의 문구와 카드 — 피그마 확정 플로우(정리 섹션 2373:329) 그대로.
// 화면은 여기서 돌려준 모양만 그린다. 플랜·체험·이름·기록 같은 분기는 전부 여기서 끝낸다
import type { CancelStayDestination, StudyMethod } from '@landit/analytics';

import { formatSubscriptionDate } from '@/features/subscription/lib/subscription-date';
import { findPlan, formatWon } from '@/features/subscription/model/plans';
import {
  chargedPrice,
  type PaidSubscriptionSummary,
} from '@/features/subscription/model/subscription-summary';

import type { RetentionReason } from './cancel-flow';

/** 라벨 한 줄 + 값 한 줄. 가로 한 행(라벨 왼쪽·값 오른쪽)으로 그린다 */
export interface RowCard {
  kind: 'row';
  label: string;
  /** 라벨 아래 작은 보조 문구 — 연간의 "연 58,500원" */
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
/** 매일 학습 알림 시각 — 사용자별 설정이 없어 서버 푸시 시각을 그대로 적는다. 시각이 바뀌면 여기만 */
export const DAILY_REMINDER_LABEL = '매일 오후 9:00';

const STAY = { label: '조금 더 써볼게요', to: 'manage' as const };

interface RetentionContext {
  summary: PaidSubscriptionSummary;
  /** 마이페이지가 쓰는 이름 — 없으면 "게스트" */
  nickname: string;
  /** 스트릭 달력의 누적 학습일. 아직 못 받았으면 null */
  totalActiveDays: number | null;
  /** "견습 마법사 Lv.3"처럼 완성된 레벨 문구. 수준을 모르면 null */
  levelLabel: string | null;
  otherText: string;
}

/** 하루 환산 요금 — 10원 단위로 반올림한다 (월 14,900 → 500, 연 58,500 → 160) */
export const dailyWon = (price: number, days: number) =>
  Math.round(price / days / 10) * 10;

const PLAN_DAYS = { monthly: 30, yearly: 365 } as const;
const PLAN_TREAT = {
  monthly: '껌 한 통 값',
  yearly: '사탕 하나 값',
} as const;

const priceContent = (summary: PaidSubscriptionSummary): RetentionContent => {
  const { plan } = summary;
  // 어느 플랜인지 모르면 숫자를 지어내지 않는다 — 문구도 카드도 플랜 없이
  if (!plan) {
    return {
      emoji: '💸',
      title: '가격이 부담되셨군요',
      body: ['조금 더 써 보고 결정해도 늦지 않아요.'],
      cards: [],
      primary: STAY,
    };
  }
  const { title } = findPlan(plan);
  const price = chargedPrice(summary, plan);
  const daily = `하루 ${formatWon(dailyWon(price, PLAN_DAYS[plan]))}`;
  const firstCharge = firstChargeRow(summary);
  return {
    emoji: '💸',
    title: '가격이 부담되셨군요',
    body: [
      `${plan === 'monthly' ? '지금' : '연간'} 요금은 ${daily}이에요.`,
      `매일 ${PLAN_TREAT[plan]}으로 영어 회화를 연습하고 있어요.`,
    ],
    cards: [
      {
        kind: 'row',
        label: `지금 · ${title}`,
        sublabel: plan === 'yearly' ? `연 ${formatWon(price)}` : undefined,
        value: daily,
      },
      ...(firstCharge ? [firstCharge] : []),
    ],
    primary: STAY,
  };
};

// 체험 중이면 아직 결제 전이다 — 언제부터 내는지 한 행 더
const firstChargeRow = (summary: PaidSubscriptionSummary): RowCard | null => {
  if (summary.kind !== 'trial' || !summary.expiresAt) return null;
  const date = formatSubscriptionDate(summary.expiresAt);
  return date ? { kind: 'row', label: '첫 결제일', value: date } : null;
};

const progressContent = ({
  nickname,
  totalActiveDays,
  levelLabel,
}: RetentionContext): RetentionContent => {
  const items = [
    ...(totalActiveDays !== null
      ? [{ value: `${totalActiveDays}일`, label: '학습한 날' }]
      : []),
    ...(levelLabel ? [{ value: levelLabel, label: '내 학습 레벨' }] : []),
  ];
  return {
    emoji: '📈',
    title: '실력이 안 느는 것 같으셨군요',
    body: [
      `매 대화를 분석해서 ${nickname}님 수준에 맞춰 가고 있어요.`,
      '지금까지 이만큼 함께했어요.',
    ],
    // 보여줄 숫자가 하나도 없으면 카드 자체를 안 그린다 — 빈 칸은 기죽이기만 한다
    cards: items.length > 0 ? [{ kind: 'stat', items }] : [],
    primary: STAY,
  };
};

const REASON_CONTENT: Record<
  Exclude<RetentionReason, 'price' | 'progress' | 'other'>,
  RetentionContent
> = {
  time: {
    emoji: '⏰',
    title: '시간이 없으셨군요',
    body: [
      `하루 ${DAILY_STUDY_MINUTES}분만 투자하면`,
      '대화부터 표현 학습까지 할 수 있어요.',
      '잊지 않게 알림도 보내드릴게요.',
    ],
    cards: [
      {
        kind: 'row',
        label: '대화부터 표현 학습까지 평균 소요 시간',
        value: `${DAILY_STUDY_MINUTES}분`,
      },
      { kind: 'row', label: '매일 학습 알림', value: DAILY_REMINDER_LABEL },
    ],
    primary: STAY,
  },
  content: {
    emoji: '🗂️',
    title: '원하는 상황이 없으셨군요',
    body: [
      '빠짐없이 읽고 꼭 답장 드려요.',
      '만들 수 있는 건 바로 시나리오로 만들어 드릴게요.',
    ],
    cards: [
      { kind: 'row', label: '편지함', value: '빠짐없이 읽고 꼭 답장해요' },
    ],
    primary: { label: '원하는 상황 알려주기', to: 'mailbox' },
  },
  bug: {
    emoji: '🐞',
    title: '불편을 드려 죄송해요',
    body: [
      '빠짐없이 읽고 꼭 답장 드려요.',
      '버그는 파악하는 즉시 바로 고치고 있어요.',
    ],
    cards: [
      {
        kind: 'row',
        label: '편지함',
        value: '고치면 편지 답장으로 알려드려요',
      },
    ],
    primary: { label: '불편한 점 알려주기', to: 'mailbox' },
  },
};

const otherContent = (otherText: string): RetentionContent => ({
  emoji: '✍️',
  title: '말씀 감사해요',
  body: [
    '적어주신 내용은 빠짐없이 읽고 꼭 답장 드려요.',
    '답장은 편지함으로 갈게요.',
  ],
  cards: [{ kind: 'quote', label: '적어주신 내용', text: otherText.trim() }],
  primary: { label: '편지함으로 답장 받기', to: 'mailbox' },
});

/** ② 화면 — 사유 하나에 한 장. "다른 방법"은 ③으로 가므로 여기 없다 */
export const retentionContent = (
  reason: RetentionReason,
  context: RetentionContext,
): RetentionContent => {
  switch (reason) {
    case 'price':
      return priceContent(context.summary);
    case 'progress':
      return progressContent(context);
    case 'other':
      return otherContent(context.otherText);
    default:
      return REASON_CONTENT[reason];
  }
};

const METHOD_CONTENT: Record<
  StudyMethod,
  { title: string; first: string; second: string }
> = {
  academy: {
    title: '수업 뒤 복습은 말하기로',
    first: '수업에서 배운 표현을 랜딧에서 말해 보세요.',
    second: '말해 본 표현은 정말 오래 남을 거예요.',
  },
  other_app: {
    title: '익힌 표현, 여기서 말해 보세요',
    first: '다른 데서 익힌 표현도 여기서 말해 보세요.',
    second: '말해 본 표현은 정말 오래 남을 거예요.',
  },
  youtube: {
    title: '본 표현을 말해 볼 차례예요',
    first: '영상으로 본 표현을 입으로 꺼내 보세요.',
    second: '말해 본 표현은 정말 오래 남을 거예요.',
  },
  abroad: {
    title: '떠나기 전에 말문을 트세요',
    first: '떠나기 전 여기서 말문을 트고 가세요.',
    second: '다녀와서도 정말 오래 이어질 거예요.',
  },
};

/** ③ 화면 — 고른 방법마다 제목·첫 줄이 다르다. 카드는 없다 */
export const methodRetentionContent = (
  method: StudyMethod,
): RetentionContent => {
  const { title, first, second } = METHOD_CONTENT[method];
  return {
    emoji: '💬',
    title,
    body: [first, second],
    cards: [],
    primary: STAY,
  };
};
