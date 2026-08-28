// 위젯 데이터 조립 — 스트릭·오늘 카드·주간 달력 응답을 브릿지 WidgetData 하나로 합친다
import type { WidgetData } from '@landit/bridge';

// 위젯 데이터는 세 도메인 응답을 합쳐야 만들어져서 가로 참조가 불가피하다 (타입만 쓴다)
import type { ScenarioCalendarResponse } from '@/features/scenario/api/calendar';
import type { DailyScenarioResponse } from '@/features/scenario/api/daily';
import type {
  CurrentStreakResponse,
  StreakCalendarResponse,
} from '@/features/streak/api/streak';

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
  // 이번 달·지난달 스트릭 달력. 마지막 완료일을 최소 한 달 범위에서 찾으려고 두 달을 받는다
  streakCalendars: Array<StreakCalendarResponse | null> = [],
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

  // 완료한 적이 한 번이라도 있는지. 첫 완료일은 "언제 시작했나"라 마지막 완료일로는 못 쓰고,
  // 있느냐 없느냐로 신규 유저와 오래 쉰 유저를 가르는 데만 쓴다
  const hasHistory =
    streakCalendars.some((month) => month?.firstActiveDate != null) ||
    calendars.some((calendar) => calendar?.startedAt != null);

  return {
    streak: streak.currentStreakDays,
    todayDone: streak.activeToday,
    lastCompletedDate: deriveLastCompletedDate({
      streak,
      doneDates: [
        ...streakCalendars.flatMap((month) => month?.activeDates ?? []),
        ...[...completedByDate]
          .filter(([, done]) => done)
          .map(([date]) => date),
      ],
      searchedFrom: earliestSearchedDate(streakCalendars, completedByDate),
      hasHistory,
    }),
    // 빈 제목은 null로 바꾼다 — 스키마가 빈 문자열을 거부해서, 그대로 두면 위젯 데이터 전체가 버려진다
    todayCardTitle: daily?.scenario?.scenarioTitle?.trim() || null,
    weeklyDone,
    // 이 값들의 기준 날짜 — 서버가 준 오늘. 위젯이 날짜에 묶인 표시(제목·주간 라벨)를 판정할 근거다
    capturedOn: today,
  };
};

// 우리가 완료 여부를 실제로 확인한 가장 이른 날 — 받아온 달의 1일과 주간 창의 첫날 중 이른 쪽.
// 여기서부터 오늘까지는 기록이 없으면 정말 안 한 것이다
const earliestSearchedDate = (
  streakCalendars: Array<StreakCalendarResponse | null>,
  completedByDate: Map<string, boolean>,
) => {
  const candidates = [
    ...streakCalendars
      .filter((month) => month !== null)
      .map(
        (month) => `${month.year}-${String(month.month).padStart(2, '0')}-01`,
      ),
    ...completedByDate.keys(),
  ];
  return candidates.reduce((earliest, date) =>
    date < earliest ? date : earliest,
  );
};

// 서버에 "마지막 완료일" 필드가 없어 유도한다.
// 스트릭이 살아있다는 것 자체가 어제까지 완료했다는 뜻이라 달력 없이도 정확하다
const deriveLastCompletedDate = ({
  streak,
  doneDates,
  searchedFrom,
  hasHistory,
}: {
  streak: CurrentStreakResponse;
  doneDates: string[];
  searchedFrom: string;
  hasHistory: boolean;
}): string | null => {
  if (streak.activeToday) return streak.today;
  if (streak.currentStreakDays > 0) return addDays(streak.today, -1);

  // 끊긴 유저는 확인한 날짜들 중 오늘 이전의 가장 최근 완료일을 찾는다
  const latest = doneDates
    .filter((date) => date < streak.today)
    .reduce<string | null>(
      (newest, date) => (newest === null || date > newest ? date : newest),
      null,
    );
  if (latest !== null) return latest;

  // 확인한 범위 어디에도 없다 = 그 전에 마지막으로 완료했다는 뜻.
  // 정확한 날짜는 몰라도 "적어도 이만큼 쉬었다"는 확실해서 범위 시작 하루 전을 쓴다.
  // 두 달치를 받아오므로 이 값이면 대개 마지막 단계(소등)에 닿는다
  return hasHistory ? addDays(searchedFrom, -1) : null;
};
