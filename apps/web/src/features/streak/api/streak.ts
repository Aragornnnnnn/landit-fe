// 스트릭 조회 — 현재 연속 일수와 월별 달력 (백엔드 CurrentStreakResponse·StreakCalendarResponse 미러)
import { api } from '@/shared/api/client';

export interface CurrentStreakResponse {
  currentStreakDays: number;
  activeToday: boolean;
}

export interface StreakCalendarResponse {
  year: number;
  month: number;
  currentStreakDays: number;
  activeToday: boolean;
  // 이력 전체의 첫 완료일. 현재 이어지는 구간의 시작일이 아니다
  streakStartedDate: string | null;
  longestStreakDays: number;
  totalActiveDays: number;
  // 요청한 월의 완료 날짜만 온다 (yyyy-MM-dd)
  activeDates: string[];
}

export const getCurrentStreak = () =>
  api.get<CurrentStreakResponse>('/api/v1/me/streak');

export const getStreakCalendar = (year: number, month: number) =>
  api.get<StreakCalendarResponse>(
    `/api/v1/me/streak/calendar?year=${year}&month=${month}`,
  );
