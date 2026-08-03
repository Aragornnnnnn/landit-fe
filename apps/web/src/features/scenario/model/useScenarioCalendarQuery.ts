// 캘린더 창 조회 상태 — 주/월 단위 창과 그 안의 날짜 칸들
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import {
  getScenarioCalendar,
  type ScenarioCalendarType,
} from '../api/calendar';
import { firstDayOfWindow } from '../lib/calendar-window';
import { scenarioKeys } from './keys';

// date를 생략하면 서버가 오늘이 든 창을 돌려준다
export const useScenarioCalendarQuery = (
  type: ScenarioCalendarType,
  date?: string,
  // 접혀 있는 창은 조회하지 않는다
  enabled = true,
) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  // 창의 첫날로 맞춰 묻는다 — 안 맞추면 같은 주를 8월 3일치·8월 5일치로 따로 받는다
  const window = date ? firstDayOfWindow(date, type) : undefined;

  const { data } = useQuery({
    queryKey: scenarioKeys.calendar(userId, type, window ?? null),
    queryFn: () => getScenarioCalendar(type, window),
    // 창을 옮기는 동안 이전 창을 그대로 둔다 — 비우면 스트립이 사라졌다 다시 그려져 깜빡인다
    placeholderData: keepPreviousData,
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    enabled: enabled && userId !== null,
  });

  // 실패해도 화면을 막지 않는다 — 달력이 비어도 오늘 카드는 그대로 쓸 수 있다
  return { calendar: data ?? null };
};
