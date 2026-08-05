// 스트릭 조회 — 현재 연속 일수와 월별 달력 (백엔드 CurrentStreakResponse·StreakCalendarResponse 미러)
import { api } from '@/shared/api/client';

import type { YearMonth } from '../lib/seoul-date';

export interface CurrentStreakResponse {
  currentStreakDays: number;
  activeToday: boolean;
  // 서버가 activeToday를 판단할 때 쓴 KST 오늘 (yyyy-MM-dd)
  today: string;
}

export interface StreakCalendarResponse {
  year: number;
  month: number;
  currentStreakDays: number;
  activeToday: boolean;
  // 서버가 activeToday를 판단할 때 쓴 KST 오늘 (yyyy-MM-dd)
  today: string;
  // 이력 전체의 첫 완료일. 현재 이어지는 구간의 시작일이 아니다
  firstActiveDate: string | null;
  longestStreakDays: number;
  totalActiveDays: number;
  // 조회한 월의 완료 날짜만 온다 (yyyy-MM-dd)
  activeDates: string[];
}

export const getCurrentStreak = () =>
  api.get<CurrentStreakResponse>('/api/v1/me/streak');

// view가 null이면 파라미터를 붙이지 않는다 — 서버가 KST 오늘이 든 달을 골라 응답의 year·month로 알려준다.
// 연·월은 둘 다 주거나 둘 다 빼야 한다 (하나만 주면 400)
export const getStreakCalendar = (view: YearMonth | null) =>
  api.get<StreakCalendarResponse>(
    view === null
      ? '/api/v1/me/streak/calendar'
      : `/api/v1/me/streak/calendar?year=${view.year}&month=${view.month}`,
  );
