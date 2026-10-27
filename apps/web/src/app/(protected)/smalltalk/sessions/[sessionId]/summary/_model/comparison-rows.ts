// 지난번과 비교 카드의 줄 — 세 지표를 라벨·값·막대 길이로 바꾼다. 막대는 둘 중 큰 값을 가득으로 친다
import type { SmallTalkSummaryComparison } from '@/features/small-talk/api/small-talk';
import { toSpeakingTimeLabel } from '@/features/small-talk/lib/speaking-time';
import type { Locale } from '@/shared/i18n/locale';
import type { Translator } from '@/shared/i18n/translator';
import { toDayLabel } from '@/shared/lib/day-label';

interface Bar {
  value: string;
  // 0~1. 막대의 길이
  ratio: number;
}

export interface ComparisonRow {
  label: string;
  previous: Bar;
  current: Bar;
}

// 둘 다 0이면 막대도 0 — 0으로 나누지 않는다
const toBars = (
  previous: number,
  current: number,
  format: (value: number) => string,
): Pick<ComparisonRow, 'previous' | 'current'> => {
  const full = Math.max(previous, current);
  const ratioOf = (value: number) => (full === 0 ? 0 : value / full);
  return {
    previous: { value: format(previous), ratio: ratioOf(previous) },
    current: { value: format(current), ratio: ratioOf(current) },
  };
};

export const toComparisonRows = (
  { previous, current }: SmallTalkSummaryComparison,
  t: Translator<'smallTalk.comparison'>,
  locale: Locale,
): ComparisonRow[] => [
  {
    label: t('speakingTimeLabel'),
    ...toBars(previous.speakingMs, current.speakingMs, (ms) =>
      toSpeakingTimeLabel(ms, locale),
    ),
  },
  {
    label: t('exchangeLabel'),
    ...toBars(previous.turnCount, current.turnCount, (count) =>
      t('exchangeCountLabel', { count }),
    ),
  },
  {
    label: t('longestTurnLabel'),
    ...toBars(previous.maxWordsInTurn, current.maxWordsInTurn, (count) =>
      t('wordCountLabel', { count }),
    ),
  },
];

// 카드 오른쪽 위 — 어느 날과 견주는지. 첫 스몰톡은 견줄 날이 없어 첫 기록이라고 말한다
export const toPeriodLabel = (
  { previousDate }: SmallTalkSummaryComparison,
  t: Translator<'smallTalk.comparison'>,
  locale: Locale,
): string =>
  previousDate
    ? t('periodCaption', { date: toDayLabel(previousDate, locale) })
    : t('firstPeriodCaption');
