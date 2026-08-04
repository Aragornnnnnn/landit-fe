// 월 달력의 뼈대 — 7열 격자와 앞뒤로 넘길 수 있는 범위. Date도 타임존도 밖으로 새지 않는다
import { monthOf, type YearMonth } from './seoul-date';

// 달 바깥 칸은 null — 앞뒤를 다른 달 날짜로 채우면 그 날의 완료 여부를 알 수 없어 거짓말이 된다
export type MonthWeek = (string | null)[];

const utc = ({ year, month }: YearMonth, day: number) =>
  new Date(Date.UTC(year, month - 1, day));

const format = (value: Date) => value.toISOString().slice(0, 10);

export const buildMonthGrid = (view: YearMonth): MonthWeek[] => {
  const dayCount = lastDayOf(view);
  const leading = utc(view, 1).getUTCDay(); // 일요일 시작

  const cells: MonthWeek = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(format(utc(view, day)));
  }
  // 마지막 주를 7칸으로 맞춘다
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: MonthWeek[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

// 다음 달 0일 = 이번 달 마지막 날
const lastDayOf = ({ year, month }: YearMonth) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export const shiftMonth = (view: YearMonth, direction: -1 | 1): YearMonth => {
  const value = new Date(Date.UTC(view.year, view.month - 1 + direction, 1));
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1 };
};

const asNumber = ({ year, month }: YearMonth) => year * 12 + month;

// 이번 달보다 뒤로는 갈 수 없다 — 미래엔 조회할 기록이 없다
export const canGoForward = (view: YearMonth, today: string) =>
  asNumber(view) < asNumber(monthOf(today));

// 첫 완료일이 있는 달이 한계다. 기록이 없으면 뒤로 갈 곳도 없다
export const canGoBack = (view: YearMonth, firstRecordDate: string | null) =>
  firstRecordDate !== null &&
  asNumber(view) > asNumber(monthOf(firstRecordDate));
