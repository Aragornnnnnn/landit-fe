// 놓친 환급액 규칙 — 무료로 대화한 날 중 오늘을 뺀 날이 며칠이고, 챌린지였다면 얼마를 받았을지 정한다
import { readSeoulDateParts } from '@/shared/lib/seoul-date';

import type { RewardPreview, RewardPreviewHistoryItem } from '../api/reward';

// 이 날수부터 놓친 환급액을 보여 준다 — 하루치는 금액이 작아 오히려 시시해 보인다
export const MISSED_MIN_DAYS = 2;

export interface MissedReward {
  // 오늘을 뺀, 무료로 대화한 날 수
  pastDays: number;
  // 그 날들의 몫 — 결제해도 돌아오지 않는 돈
  missedWon: number;
  // 오늘의 시나리오를 이미 했는가 — 오늘 몫은 지금 결제하면 받는다
  talkedToday: boolean;
  dailyWon: number;
  // 서버가 정한 오늘 (yyyy-MM-dd). 읽을 수 없으면 null — 기록의 어느 줄이 오늘인지 이 날짜로 가린다
  today: string | null;
}

const talkedTodayOf = (preview: RewardPreview) => preview.todayEarnedWon > 0;

// 오늘을 뺀 날수 — 날수와 금액을 미리보기 한 응답 안에서만 센다. 다른 응답의 오늘과 섞으면 한쪽만 오늘이 반영돼 어긋난다
export const pastDaysOf = (preview: RewardPreview) =>
  preview.completedDays - (talkedTodayOf(preview) ? 1 : 0);

// 서버가 요약을 계산한 시각을 서울 날짜로 — 폰 시계는 날짜를 정하는 데 쓰지 않는다
const seoulDateOf = (dateTime: string) => {
  const parts = readSeoulDateParts(dateTime, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : null;
};

/**
 * @param computedAt 환급 요약을 서버가 계산한 시각 — 이 날짜가 오늘이다
 */
export const missedRewardOf = (
  preview: RewardPreview | null,
  computedAt: string,
): MissedReward | null => {
  if (!preview) return null;
  const pastDays = pastDaysOf(preview);
  if (pastDays < MISSED_MIN_DAYS) return null;
  return {
    pastDays,
    missedWon: preview.balanceWon - preview.todayEarnedWon,
    talkedToday: talkedTodayOf(preview),
    dailyWon: preview.dailyAmountWon,
    today: seoulDateOf(computedAt),
  };
};

export interface MissedRow {
  id: string;
  // "10.13", 오늘이면 "오늘"
  dateLabel: string;
  amountWon: number;
  // 오늘 줄만 아직 받을 수 있다
  today: boolean;
}

const dateLabelOf = (date: string) =>
  `${Number(date.slice(5, 7))}.${Number(date.slice(8))}`;

/**
 * 무료 적립 기록을 줄로 바꾼다. 서버가 준 순서(최신부터)를 그대로 둔다.
 *
 * @param today 서버가 정한 오늘 — 기록은 오늘 적립분도 담아 오고, 그 줄만 아직 받을 수 있다
 */
export const missedRowsOf = (
  items: RewardPreviewHistoryItem[],
  today: string | null,
): MissedRow[] => {
  // 이어 받는 사이 새 줄이 생기면 같은 날이 두 번 올 수 있다
  const seen = new Set<string>();
  return items
    .filter((item) => !seen.has(item.date) && seen.add(item.date))
    .map((item) => {
      const isToday = item.date === today;
      return {
        id: item.date,
        dateLabel: isToday ? '오늘' : dateLabelOf(item.date),
        amountWon: item.amountWon,
        today: isToday,
      };
    });
};
