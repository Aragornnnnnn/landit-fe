// 캘린더 창을 앞뒤로 옮기는 날짜 계산 — Date도 타임존도 안 본다. 문자열만 받고 문자열만 돌려준다
import type { ScenarioCalendarType } from '../api/calendar';

// yyyy-MM-dd를 UTC 자정으로 읽는다. 로컬 타임존으로 읽으면 하루가 밀린다
const parse = (date: string) => new Date(`${date}T00:00:00Z`);

const format = (value: Date) => value.toISOString().slice(0, 10);

// 주는 7일, 달은 1개월씩 옮긴다. 달 이동은 말일이 없는 달로 넘어가도 그 달 안에 머물게 1일로 맞춘다
export const shiftWindow = (
  date: string,
  type: ScenarioCalendarType,
  direction: -1 | 1,
): string => {
  const value = parse(date);

  if (type === 'WEEK') {
    value.setUTCDate(value.getUTCDate() + direction * 7);
    return format(value);
  }

  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + direction);
  return format(value);
};

// 다음 창에 오늘이 안 들어오면 더 갈 곳이 없다 — 미래는 조회할 게 없다
export const canGoForward = (
  date: string,
  type: ScenarioCalendarType,
  today: string,
) => shiftWindow(date, type, 1) <= lastDayOfWindow(today, type);

// 지금 보고 있는 창이 시작일보다 앞서면 더 갈 곳이 없다
export const canGoBack = (
  date: string,
  type: ScenarioCalendarType,
  startedAt: string | null,
) =>
  startedAt === null ||
  shiftWindow(date, type, -1) >= firstDayOfWindow(startedAt, type);

// 일요일 시작 — 서버가 주 창을 일요일부터 내려주는 것과 맞춘다
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 그 날의 요일. 로컬 타임존으로 읽으면 하루가 밀려 요일이 어긋난다
export const weekdayIndexOf = (date: string) => parse(date).getUTCDay();

// 같은 창을 가리키는 날짜들을 하나로 모은다 — 8월 3일과 8월 5일은 같은 주, 같은 조회다
export const firstDayOfWindow = (date: string, type: ScenarioCalendarType) => {
  if (type === 'MONTH') return `${date.slice(0, 8)}01`;
  const value = parse(date);
  // 일요일 시작 — 서버가 주 창을 일요일부터 내려주는 것과 맞춘다
  value.setUTCDate(value.getUTCDate() - value.getUTCDay());
  return format(value);
};

const lastDayOfWindow = (date: string, type: ScenarioCalendarType) => {
  const value = parse(firstDayOfWindow(date, type));
  if (type === 'WEEK') {
    value.setUTCDate(value.getUTCDate() + 6);
  } else {
    value.setUTCMonth(value.getUTCMonth() + 1);
    value.setUTCDate(0);
  }
  return format(value);
};
