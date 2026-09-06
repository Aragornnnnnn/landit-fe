// 위젯 데이터 조립 — 스트릭·오늘 카드·스트릭 달력 응답을 브릿지 WidgetData 하나로 합친다
// TODO: 백엔드가 /me/streak에 lastCompletedDate를 내려주면 유도 사다리 ③·④와
//       earliestSearchedDate·hasHistory가 통째로 지워진다 (달력은 주간 창용으로만 남는다)

import type { WidgetData } from '@landit/bridge';

// 위젯 데이터는 스트릭·달력 응답을 합쳐야 만들어져서 가로 참조가 불가피하다 (타입만 쓴다)
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

/**
 * 서버 응답 3종을 위젯이 쓸 WidgetData 하나로 조립한다.
 *
 * @param streak - `/me/streak` 응답. 스트릭 숫자·오늘 완료 여부·서버 기준 오늘의 단일 출처
 * @param streakCalendars - 이번 달·지난달 스트릭 달력. 주간 창을 채우고 마지막 완료일을
 *   최소 한 달 범위에서 찾는다. 최근 7일은 항상 두 달 안에 들어간다. 조회 실패한 달은 null
 */
export const buildWidgetData = (
  streak: CurrentStreakResponse,
  streakCalendars: Array<StreakCalendarResponse | null> = [],
): WidgetData => {
  const today = streak.today;

  // 스트릭 활동일 집합 — 주간 창과 마지막 완료일 탐색이 함께 쓴다
  const activeDates = new Set(
    streakCalendars.flatMap((month) => month?.activeDates ?? []),
  );

  const weeklyDone = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    // 오늘 칸은 activeToday를 쓴다 — 방금 완료한 건 달력에 아직 없을 수 있다
    return date === today ? streak.activeToday : activeDates.has(date);
  });

  // 완료한 적이 한 번이라도 있는지. 첫 완료일은 "언제 시작했나"라 마지막 완료일로는 못 쓰고,
  // 있느냐 없느냐로 신규 유저와 오래 쉰 유저를 가르는 데만 쓴다
  const hasHistory = streakCalendars.some(
    (month) => month?.firstActiveDate != null,
  );

  const lastCompletedDate = deriveLastCompletedDate({
    streak,
    activeDates,
    searchedFrom: earliestSearchedDate(streakCalendars, today),
    hasHistory,
  });

  return {
    streak: streak.currentStreakDays,
    todayDone: streak.activeToday,
    lastCompletedDate,
    weeklyDone,
    // 이 값들의 기준 날짜 — 서버가 준 오늘. 위젯이 시작 전 여부·주간 라벨을 판정할 근거다
    capturedOn: today,
  };
};

/**
 * 우리가 활동 여부를 실제로 확인한 가장 이른 날 — 받아온 달의 1일과 오늘(`/me/streak`) 중 이른 쪽.
 * 여기서부터 오늘까지는 기록이 없으면 정말 안 한 것이다.
 */
const earliestSearchedDate = (
  streakCalendars: Array<StreakCalendarResponse | null>,
  today: string,
) =>
  streakCalendars
    .filter((month) => month !== null)
    .map((month) => `${month.year}-${String(month.month).padStart(2, '0')}-01`)
    .reduce((earliest, date) => (date < earliest ? date : earliest), today);

/** 서버에 "마지막 완료일" 필드가 없어 확실한 것부터 4단계로 추리한다. */
const deriveLastCompletedDate = ({
  streak,
  activeDates,
  searchedFrom,
  hasHistory,
}: {
  streak: CurrentStreakResponse;
  activeDates: Set<string>;
  searchedFrom: string;
  hasHistory: boolean;
}): string | null => {
  // ① 오늘 완료했다 → 오늘
  if (streak.activeToday) return streak.today;
  // ② 스트릭이 살아있다 = 어제까지는 했다는 뜻 — 달력 없이도 정확하다
  if (streak.currentStreakDays > 0) return addDays(streak.today, -1);

  // ③ 끊긴 유저 — 달력이 기억하는 활동일 중 오늘 이전의 가장 최근 날
  const latest = [...activeDates]
    .filter((date) => date < streak.today)
    .reduce<string | null>(
      (newest, date) => (newest === null || date > newest ? date : newest),
      null,
    );
  if (latest !== null) return latest;

  // ④ 조회 범위 어디에도 없다 — 정확한 날짜는 몰라도 "적어도 이만큼 쉬었다"는 확실해서
  //    범위 시작 하루 전을 하한으로 쓴다. 몰락은 30일이면 끝이라 하한으로도 소등에 닿는다.
  //    이력이 아예 없는 신규 유저는 몰락 연출을 하면 안 되니 null
  return hasHistory ? addDays(searchedFrom, -1) : null;
};
