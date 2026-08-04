// 달력 한 주 — 이어진 구간 띠를 먼저 깔고 그 위에 칸 일곱 개를 올린다
import type { MonthWeek } from '../lib/month-grid';
import { runsOf, type DayMark } from '../model/calendar-day';
import { MARK_ROW_HEIGHT, StreakDay } from './StreakDay';

// 띠가 열 양옆에서 물러나는 폭. 시안 F1이 하루짜리 띠를 열 폭 50px 안에 40px로 그린다
const BAND_INSET = 5;

interface StreakWeekProps {
  week: MonthWeek;
  activeDates: Set<string>;
  markOfDate: (date: string) => DayMark;
}

export const StreakWeek = ({
  week,
  activeDates,
  markOfDate,
}: StreakWeekProps) => (
  <div className="relative grid grid-cols-7">
    {/* 띠 레이어 — 칸과 같은 격자에 얹어 열 경계를 그대로 따라간다.
        하루짜리는 동그라미가 되고, 붙어 있으면 알약 하나로 이어 보인다 */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-7"
      style={{ height: MARK_ROW_HEIGHT }}
    >
      {runsOf(week, activeDates).map((run) => (
        <span
          key={run.start}
          className="rounded-full bg-streak-band"
          style={{
            gridColumn: `${run.start + 1} / span ${run.length}`,
            marginInline: BAND_INSET,
          }}
        />
      ))}
    </div>

    {week.map((date, index) => (
      <StreakDay
        key={date ?? `blank-${index}`}
        date={date}
        mark={date === null ? 'blank' : markOfDate(date)}
      />
    ))}
  </div>
);
