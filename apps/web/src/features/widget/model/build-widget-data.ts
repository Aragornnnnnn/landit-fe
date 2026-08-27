// 위젯 스냅샷 조립 — 스트릭·오늘 카드·주간 달력 응답을 브릿지 WidgetData 하나로 합친다
import type { WidgetData } from '@landit/bridge';

// 위젯 스냅샷은 세 도메인 응답을 합쳐야 만들어져서 가로 참조가 불가피하다 (타입만 쓴다)
import type { ScenarioCalendarResponse } from '@/features/scenario/api/calendar';
import type { DailyScenarioResponse } from '@/features/scenario/api/daily';
import type { CurrentStreakResponse } from '@/features/streak/api/streak';

// yyyy-MM-dd를 UTC 자정으로 읽어 일 단위로만 움직인다 — 로컬 타임존으로 읽으면 하루가 밀린다
const parse = (date: string) => new Date(`${date}T00:00:00Z`);

const format = (value: Date) => value.toISOString().slice(0, 10);

const addDays = (date: string, days: number) => {
  const value = parse(date);
  value.setUTCDate(value.getUTCDate() + days);
  return format(value);
};

export const buildWidgetData = (
  streak: CurrentStreakResponse,
  daily: DailyScenarioResponse | null,
  // 최근 7일이 두 창에 걸칠 수 있어 이번 주·지난주를 함께 받는다. 조회 실패한 창은 null
  calendars: Array<ScenarioCalendarResponse | null>,
): WidgetData => {
  const today = streak.today;

  const completedByDate = new Map<string, boolean>();
  for (const calendar of calendars) {
    for (const day of calendar?.days ?? []) {
      completedByDate.set(day.date, day.completed);
    }
  }
  // 오늘 칸은 /me/streak가 단일 출처다 — 달력 캐시가 낡아도 activeToday가 이긴다
  completedByDate.set(today, streak.activeToday);

  const weeklyDone = Array.from(
    { length: 7 },
    (_, index) => completedByDate.get(addDays(today, index - 6)) ?? false,
  );

  return {
    streak: streak.currentStreakDays,
    todayDone: streak.activeToday,
    lastCompletedDate: deriveLastCompletedDate(streak, completedByDate),
    todayCardTitle: daily?.scenario?.scenarioTitle ?? null,
    weeklyDone,
  };
};

// 서버에 "마지막 완료일" 필드가 없어 유도한다.
// 스트릭이 살아있다는 것 자체가 어제까지 완료했다는 뜻이라 달력 없이도 정확하다
const deriveLastCompletedDate = (
  streak: CurrentStreakResponse,
  completedByDate: Map<string, boolean>,
): string | null => {
  if (streak.activeToday) return streak.today;
  if (streak.currentStreakDays > 0) return addDays(streak.today, -1);

  // 끊긴 유저는 달력 창(최근 2주) 안에서 가장 최근 완료일을 찾는다.
  // 창보다 오래 쉰 유저는 null이 되어 위젯이 '완료 이력 없음'과 똑같이 다룬다 —
  // 몰락 단계 대신 0일 시간표를 그린다. 두 경우를 나누려면 서버의 마지막 완료일 필드가 필요하다(백엔드 요청 예정).
  // 위젯에 이미 저장된 값은 그 사용자가 마지막으로 앱을 열었을 때의 정확한 날짜라, 앱을 안 여는 동안의 몰락 연출은 정상 동작한다
  let latest: string | null = null;
  for (const [date, completed] of completedByDate) {
    if (!completed || date >= streak.today) continue;
    if (latest === null || date > latest) latest = date;
  }
  return latest;
};
