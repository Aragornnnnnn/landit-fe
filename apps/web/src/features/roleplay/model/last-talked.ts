// 시나리오 카드의 「마지막으로 대화한 때」 — 오늘 / N일 전 / 날짜.
// 백엔드가 마지막 대화 시각을 주기 전까지는 카드가 만든 때(createdAt)를 넣는다
import { parseDateString } from '@/shared/lib/date-string';

export type LastTalked =
  { kind: 'today' } | { kind: 'daysAgo'; days: number } | { kind: 'date' };

// 이보다 오래되면 며칠 전 대신 날짜로 — 「12일 전」보다 「10월 19일」이 빨리 읽힌다
const DAYS_AGO_LIMIT = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

// 시간대 없는 날짜 두 개의 차이 — 둘 다 UTC 자정으로 읽으면 서머타임·시간대가 끼어들지 않는다
const daysBetween = (from: string, to: string) =>
  Math.round(
    (parseDateString(to).getTime() - parseDateString(from).getTime()) / DAY_MS,
  );

/**
 * @param isoDateTime 서버의 LocalDateTime(2026-10-28T21:03:11) — 앞의 날짜만 본다
 * @param today 오늘 날짜(yyyy-MM-dd)
 */
export const toLastTalked = (
  isoDateTime: string,
  today: string,
): LastTalked => {
  const days = daysBetween(isoDateTime.slice(0, 10), today);
  if (days <= 0) return { kind: 'today' };
  if (days < DAYS_AGO_LIMIT) return { kind: 'daysAgo', days };
  return { kind: 'date' };
};
