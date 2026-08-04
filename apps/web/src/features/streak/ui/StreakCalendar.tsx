// 월 달력 — 월 이동 머리와 7열 격자. 무엇을 그릴지는 calendar-day 규칙이 정한다
import type { StreakCalendarResponse } from '../api/streak';
import { buildMonthGrid } from '../lib/month-grid';
import { formatMonthLabel, type YearMonth } from '../lib/seoul-date';
import { markOf } from '../model/calendar-day';
import { StreakWeek } from './StreakWeek';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface StreakCalendarProps {
  view: YearMonth;
  today: string;
  calendar: StreakCalendarResponse;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoMonth: (direction: -1 | 1) => void;
}

export const StreakCalendar = ({
  view,
  today,
  calendar,
  canGoBack,
  canGoForward,
  onGoMonth,
}: StreakCalendarProps) => {
  const activeDates = new Set(calendar.activeDates);

  return (
    // 통계 카드와 같은 옷을 입혀 둘이 형제로 읽히게 한다 — 달력만 배경에 놓으면 혼자 떠 보인다
    <section className="mx-5 mt-7 rounded-[20px] border border-border bg-card pt-4 pb-3">
      {/* 화살표는 양 끝에 붙이고 달 이름은 폭 전체의 가운데에 둔다 */}
      <header className="relative flex items-center justify-center pb-4">
        <MonthArrow
          direction={-1}
          label="이전 달"
          disabled={!canGoBack}
          onPress={onGoMonth}
        />
        <h3 className="text-[16px] font-black text-foreground">
          {formatMonthLabel(view)}
        </h3>
        <MonthArrow
          direction={1}
          label="다음 달"
          disabled={!canGoForward}
          onPress={onGoMonth}
        />
      </header>

      <div className="grid grid-cols-7 pb-3">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="text-center text-[11px] font-medium text-muted-foreground"
          >
            {weekday}
          </span>
        ))}
      </div>

      {buildMonthGrid(view).map((week) => (
        // 주의 첫 유효 날짜가 그 행을 대표한다 (앞이 빈 첫 주도 하나는 반드시 있다)
        <StreakWeek
          key={week.find(Boolean)}
          week={week}
          activeDates={activeDates}
          markOfDate={(date) =>
            markOf(date, {
              today,
              activeDates,
              firstRecordDate: calendar.streakStartedDate,
            })
          }
        />
      ))}
    </section>
  );
};

const MonthArrow = ({
  direction,
  label,
  disabled,
  onPress,
}: {
  direction: -1 | 1;
  label: string;
  disabled: boolean;
  onPress: (direction: -1 | 1) => void;
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={() => onPress(direction)}
    className={`absolute flex size-9 items-center justify-center text-[18px] leading-none font-bold text-muted-foreground transition-all active:scale-90 disabled:opacity-25 ${
      direction === -1 ? 'left-0' : 'right-0'
    }`}
  >
    {direction === -1 ? '‹' : '›'}
  </button>
);
