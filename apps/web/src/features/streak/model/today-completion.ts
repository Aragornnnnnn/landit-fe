// 오늘 완료를 캐시에 미리 반영하는 규칙 — 서버 응답을 기다리지 않는다
// 응답을 기다리면 홈으로 돌아왔을 때 옛 숫자를 먼저 보여주고 뒤늦게 번쩍인다.
// 완료한 순간 결과는 이미 정해져 있다: 오늘이 채워지고, 아직이었다면 하루가 는다
import type {
  CurrentStreakResponse,
  StreakCalendarResponse,
} from '../api/streak';

// 같은 날 두 번 완료해도 활동일은 한 번만 센다 — 백엔드와 같은 규칙이라 숫자가 어긋나지 않는다
export const withTodayCompleted = (
  streak: CurrentStreakResponse,
): CurrentStreakResponse =>
  streak.activeToday
    ? streak
    : { currentStreakDays: streak.currentStreakDays + 1, activeToday: true };

export const calendarWithTodayCompleted = (
  calendar: StreakCalendarResponse,
  today: string,
): StreakCalendarResponse => {
  if (calendar.activeDates.includes(today)) return calendar;

  const { currentStreakDays, activeToday } = withTodayCompleted(calendar);
  // 보고 있는 달이 오늘이 든 달일 때만 날짜를 넣는다. 요약 숫자는 달과 무관하므로 늘 따라간다
  const inView = today.startsWith(
    `${calendar.year}-${String(calendar.month).padStart(2, '0')}`,
  );

  return {
    ...calendar,
    currentStreakDays,
    activeToday,
    longestStreakDays: Math.max(calendar.longestStreakDays, currentStreakDays),
    totalActiveDays: calendar.totalActiveDays + 1,
    activeDates: inView
      ? [...calendar.activeDates, today].sort()
      : calendar.activeDates,
  };
};
