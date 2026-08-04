// 시나리오 캘린더 조회 — 주/월 단위 창의 날짜 칸들 (백엔드 ScenarioCalendarResponse 미러)
import { api } from '@/shared/api/client';

export type ScenarioCalendarType = 'WEEK' | 'MONTH';

export interface ScenarioCalendarResponse {
  type: ScenarioCalendarType;
  // 창의 기준 날짜. 요청에서 생략하면 오늘이 담겨 온다
  date: string;
  // 헤더 문구를 서버가 만들어 준다 — WEEK은 "2026년 7월 5주차", MONTH은 "2026년 7월"
  label: string;
  // 서버(Asia/Seoul) 기준 오늘. 기기 타임존과 어긋나지 않게 이 값을 기준으로 판단한다
  today: string;
  // 처음 시나리오를 완료한 날. 이력이 없으면 null — 이보다 과거로는 넘길 이유가 없다
  startedAt: string | null;
  // WEEK 7개, MONTH은 그 달 일수. 날짜 오름차순
  days: ScenarioCalendarDay[];
}

export interface ScenarioCalendarDay {
  date: string;
  completed: boolean;
  // 완료한 날은 그 시나리오, 미완료 오늘 칸은 배정된 시나리오, 놓친 날은 null
  scenarioId: number | null;
  // 완료 전에는 썸네일을 공개하지 않는다 — 미완료 칸은 null
  thumbnailUrl: string | null;
}

// date를 생략하면 서버가 오늘이 든 창을 돌려준다
export const getScenarioCalendar = (
  type: ScenarioCalendarType,
  date?: string,
) =>
  api.get<ScenarioCalendarResponse>(
    `/api/v1/scenarios/calendar?type=${type}${date ? `&date=${encodeURIComponent(date)}` : ''}`,
  );
