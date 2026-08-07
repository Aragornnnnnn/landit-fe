// 달력 한 칸이 어떤 상태인지 정하는 순수 함수 — 칸을 그리는 규칙을 한곳에 모은다
import type { ScenarioCalendarDay } from '../api/calendar';

export type DayState =
  // 그날 대화를 끝냈다 — 시나리오 사진이 들어간다
  | 'completed'
  // 오늘인데 아직 안 깼다 — 무엇이 올지 모르니 물음표
  | 'today'
  // 지나갔는데 비어 있다
  | 'missed'
  // 기록이 시작되기 전이거나 아직 오지 않은 날 — 그릴 것이 없다
  | 'blank';

interface DayContext {
  // 서버(Asia/Seoul) 기준 오늘
  today: string;
  // 처음 시나리오를 완료한 날. 이력이 없으면 null
  startedAt: string | null;
}

export const dayStateOf = (
  day: ScenarioCalendarDay,
  { today, startedAt }: DayContext,
): DayState => {
  if (day.completed) return 'completed';
  if (day.date === today) return 'today';

  const beforeStart = startedAt !== null && day.date < startedAt;
  if (day.date > today || beforeStart) return 'blank';

  return 'missed';
};

// 카드를 열 수 있는 날 — 놓친 날은 서버가 시나리오를 주지 않는다
export const isOpenable = (state: DayState) =>
  state === 'completed' || state === 'today';
