'use client';

// 날짜 스트립 — 접으면 한 주, 펼치면 한 달. 누르면 그날 카드로 간다
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { track } from '@/shared/analytics';
import { DURATION, EASE_STANDARD } from '@/shared/motion';
import { registerOpenSheet } from '@/shared/ui/bottom-sheet-back';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/Icons';

import type { ScenarioCalendarType } from '../api/calendar';
import {
  canGoBack,
  canGoForward,
  datesOfMonth,
  shiftWindow,
  WEEKDAY_LABELS,
  weekdayIndexOf,
} from '../lib/calendar-window';
import { dayStateOf } from '../lib/day-state';
import { useScenarioCalendarQuery } from '../model/useScenarioCalendarQuery';
import { CalendarDay } from './calendar/CalendarDay';

// 그 달 1일이 몇 번째 칸에서 시작하는지
const leadingBlanks = (firstDate: string) => weekdayIndexOf(firstDate);

interface CalendarStripProps {
  // URL의 date가 가리키는 보고 있는 날. 창도 이 날을 따른다. 없으면 오늘이다
  date?: string;
  // 오늘을 고르면 null을 준다 — 오늘은 날짜로 지목하는 날이 아니라 기본값이다
  onSelect: (date: string | null) => void;
}

export const CalendarStrip = ({
  date: routeDate,
  onSelect,
}: CalendarStripProps) => {
  const reduced = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  // 창은 보고 있는 날과 따로 움직인다 — 지난 주를 훑어보다 아무 날도 안 고를 수 있다
  const [movedTo, setMovedTo] = useState<string | undefined>(undefined);
  // URL의 date가 바뀌면 훑어보던 창은 내려놓고 URL을 따른다
  const [seenRoute, setSeenRoute] = useState(routeDate);
  if (seenRoute !== routeDate) {
    setSeenRoute(routeDate);
    setMovedTo(undefined);
  }
  const windowDate = movedTo ?? routeDate;
  // 펼치기 직전 창 — 펼친 동안 주 조회를 여기에 묶어 두고, 안 고르고 접으면 여기로 돌아간다.
  // 조회 키가 되므로 ref가 아니라 상태여야 한다
  const [collapsedFrom, setCollapsedFrom] = useState<string | undefined>(
    undefined,
  );

  // 펼친 동안 네이티브 뒤로가기는 화면 전환 대신 패널을 접는다 — 안 그러면 뒤로가기가 탭 종료 흐름으로 새서 두 번째 뒤로가기에 앱이 꺼진다
  useEffect(() => {
    if (!expanded) return;
    return registerOpenSheet(() => {
      // 접는 길이 셋(토글·바깥 탭·뒤로가기)이라 여기도 전환으로 남긴다 — 빼면 주 전환 수만 준다
      track(EVENTS.CALENDAR_VIEW_SWITCHED, { view: 'week' });
      setMovedTo(collapsedFrom);
      setExpanded(false);
    });
  }, [expanded, collapsedFrom]);

  // 펼친 동안 배경 스크롤을 막는다 — 패널이 absolute라 막지 않으면 배경과 같이 스크롤돼 겹침이 깨진다
  useEffect(() => {
    if (!expanded) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [expanded]);

  // 스트립과 패널은 서로 다른 창을 본다. 조회 하나를 돌려 쓰면 펼치는 순간
  // 주 스트립이 그릴 것을 잃어 번쩍인다.
  // 펼친 동안 주 조회는 그 자리에 묶어 둔다 — 달을 넘길 때마다 가려진 주를 새로 받게 된다
  const { calendar: week, isPlaceholderData: weekLoading } =
    useScenarioCalendarQuery('WEEK', expanded ? collapsedFrom : windowDate);
  const { calendar: month } = useScenarioCalendarQuery(
    'MONTH',
    windowDate,
    expanded,
  );

  // 처음 들어와 응답이 없을 때도 같은 틀에 자리표시를 그린다 — 빈 자리였다가 스트립이 나타나면 튀어 보인다
  if (!week) return <StripSkeleton />;

  // 라벨과 이동 한계는 지금 보고 있는 단위에서 가져온다
  const shown = expanded ? (month ?? week) : week;
  // 새 주로 옮겨 응답을 기다리는 중 — 직전 주를 보이면 고른 날이 없는 엉뚱한 주가 떠 있다
  const loadingWeek = weekLoading && !expanded;
  // 이름표도 지금 보는 단위의 응답이 와야 정해진다 — 달을 펼쳤는데 주 이름표가 남아 있으면 엉뚱하다
  const loadingLabel = expanded ? !month : loadingWeek;
  const { today, startedAt } = shown;
  const type: ScenarioCalendarType = expanded ? 'MONTH' : 'WEEK';
  const anchor = windowDate ?? today;
  // 선택은 응답이 아니라 URL의 date를 따른다 — 누르자마자 옮겨져야 눌린 줄 안다
  const selected = routeDate ?? today;

  const move = (direction: -1 | 1) => {
    track(EVENTS.CALENDAR_PERIOD_MOVED, {
      direction: direction === -1 ? 'prev' : 'next',
      view: expanded ? 'month' : 'week',
    });
    setMovedTo(shiftWindow(anchor, type, direction));
  };

  const toggle = (next: ScenarioCalendarType) => {
    track(EVENTS.CALENDAR_VIEW_SWITCHED, {
      view: next === 'MONTH' ? 'month' : 'week',
    });
    if (next === 'MONTH') {
      setCollapsedFrom(windowDate);
    } else {
      // 날을 고르지 않고 접었으니 펼치기 전 주로 되돌린다
      setMovedTo(collapsedFrom);
    }
    setExpanded(next === 'MONTH');
  };

  const selectDay = (day: string) => {
    track(EVENTS.CALENDAR_DATE_SELECTED, { is_today: day === today });
    onSelect(day === today ? null : day);
    // 골랐으면 패널을 접고 창을 URL보다 먼저 고른 날로 옮긴다(오늘은 날짜 없는 창이 정본)
    if (expanded) {
      setMovedTo(day === today ? undefined : day);
      setExpanded(false);
    }
  };

  return (
    // 달 보기는 카드를 밀어내지 않고 그 위에 겹쳐 뜬다 — 카드가 눌리면 오늘 할 일이 작아 보인다
    <div className="relative z-20 shrink-0 bg-background px-5 pb-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ArrowButton
            direction={-1}
            disabled={!canGoBack(anchor, type, startedAt)}
            onClick={() => move(-1)}
          />
          <span className="text-base font-extrabold text-foreground">
            {loadingLabel ? <LabelSkeleton /> : shown.label}
          </span>
          <ArrowButton
            direction={1}
            disabled={!canGoForward(anchor, type, today)}
            onClick={() => move(1)}
          />
        </div>

        <TypeToggle value={type} onChange={toggle} />
      </div>

      {/* 주 스트립은 달을 펼쳐도 지우지 않는다 — 지우면 이 영역 높이가 줄어
          아래 붙은 패널이 위로 점프한다. 달 패널이 이 위를 덮으며 펼쳐진다 */}
      <div className="relative mt-1.5 min-h-[72px]">
        {loadingWeek ? (
          <WeekSkeleton />
        ) : (
          <div className="grid grid-cols-7">
            {week.days.map((day) => (
              <CalendarDay
                key={day.date}
                day={day}
                today={today}
                startedAt={startedAt}
                selected={day.date === selected}
                onSelect={selectDay}
                animated={!expanded}
                label="weekday"
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <>
              {/* 바깥을 누르면 접힌다 — 토글을 다시 찾아가지 않아도 되게 */}
              {/* 좌우는 패널(-inset-x-5)과 같은 폭까지 — 스트립 패딩만큼 좁으면 양옆에 안 덮인 띠가 남는다 */}
              <motion.button
                type="button"
                aria-label="달력 닫기"
                onClick={() => toggle('WEEK')}
                className="absolute -inset-x-5 top-0 h-screen cursor-default bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
              />

              <motion.div
                className="absolute -inset-x-5 -top-1.5 overflow-hidden rounded-b-[24px] bg-background shadow-[0_14px_14px_0_rgba(26,20,13,0.2)]"
                initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                animate={
                  reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }
                }
                exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
              >
                <div className="px-4 pt-3 pb-4">
                  <div className="grid grid-cols-7 justify-items-center pb-1.5">
                    {WEEKDAY_LABELS.map((weekday) => (
                      <span
                        key={weekday}
                        className="text-xs font-bold text-muted-foreground/60"
                      >
                        {weekday}
                      </span>
                    ))}
                  </div>

                  {/* 월 응답이 오기 전에는 스켈레톤 — 주 7일을 달 격자에 그리면 달력이 주처럼 보인다 */}
                  {month ? (
                    <div className="grid grid-cols-7 gap-y-0.5">
                      {/* 1일이 실제 요일 칸에 서야 한다 — 앞을 빈 칸으로 채운다 */}
                      {Array.from({
                        length: leadingBlanks(month.days[0].date),
                      }).map((_, index) => (
                        <span key={`blank-${index}`} />
                      ))}

                      {month.days.map((day) => (
                        <CalendarDay
                          key={day.date}
                          day={day}
                          today={today}
                          startedAt={startedAt}
                          selected={day.date === selected}
                          onSelect={selectDay}
                        />
                      ))}
                    </div>
                  ) : (
                    <MonthSkeleton
                      date={anchor}
                      today={today}
                      startedAt={startedAt}
                    />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 달 격자 자리표시 — 날짜 숫자와 1일의 요일은 응답 없이도 정해지니 그대로 쓰고 동그라미만 비운다.
// 칸 수가 실제 격자와 같아 응답이 와도 줄 수가 안 바뀐다. 칸 치수는 CalendarDay에 맞춘다
const MonthSkeleton = ({
  date,
  today,
  startedAt,
}: {
  date: string;
  today: string;
  startedAt: string | null;
}) => {
  const dates = datesOfMonth(date);
  // 칸 상태 규칙은 실제 칸과 같은 곳에서 가져온다 — 완료 여부는 몰라도 '그릴 게 없는 날'은 정해진다
  const isBlank = (day: string) =>
    dayStateOf(
      { date: day, completed: false, scenarioId: null, thumbnailUrl: null },
      { today, startedAt },
    ) === 'blank';
  return (
    <div
      role="status"
      aria-label="달력 불러오는 중"
      className="grid grid-cols-7 gap-y-0.5"
    >
      {Array.from({ length: leadingBlanks(dates[0]) }).map((_, index) => (
        <span key={`blank-${index}`} />
      ))}
      {dates.map((day) => (
        <span
          key={day}
          aria-hidden
          className="flex w-full flex-col items-center gap-1 border-2 border-transparent pt-1.5 pb-1"
        >
          {/* 오늘 뒤·시작 전 날은 실제 격자에서도 동그라미가 없다 — 자리만 지킨다 */}
          <span
            className={`size-10 rounded-full min-[390px]:size-11 ${
              isBlank(day) ? '' : 'animate-skeleton-flow'
            }`}
          />
          <span
            className={`text-[13px] leading-[1.15] ${
              isBlank(day)
                ? 'text-muted-foreground/40'
                : 'text-muted-foreground'
            }`}
          >
            {Number(day.slice(8))}
          </span>
        </span>
      ))}
    </div>
  );
};

const ArrowButton = ({
  direction,
  disabled,
  onClick,
}: {
  direction: -1 | 1;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={direction === -1 ? '이전' : '다음'}
    className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-secondary disabled:opacity-25"
  >
    {direction === -1 ? (
      <ChevronLeftIcon size={16} />
    ) : (
      <ChevronRightIcon size={16} />
    )}
  </button>
);

const TypeToggle = ({
  value,
  onChange,
}: {
  value: ScenarioCalendarType;
  onChange: (type: ScenarioCalendarType) => void;
}) => (
  <div className="flex rounded-full bg-secondary p-0.5">
    {(
      [
        { id: 'WEEK', label: '주' },
        { id: 'MONTH', label: '월' },
      ] as const
    ).map((option) => (
      <button
        key={option.id}
        type="button"
        onClick={() => onChange(option.id)}
        aria-pressed={value === option.id}
        // 보이는 크기는 그대로 두고 눌리는 자리만 넓힌다 — 손끝으로 겨누기엔 24px이 좁다
        className={`relative rounded-full px-3.5 py-1 text-xs font-bold transition-colors after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] ${
          value === option.id
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

// 이름표는 서버가 정한다 — 응답 전에는 직전 주 이름표 대신 비슷한 길이의 자리만 잡는다
const LabelSkeleton = () => (
  <span
    aria-hidden
    className="animate-skeleton-flow rounded-md text-transparent select-none"
  >
    0000년 00월 0주차
  </span>
);

// 첫 응답 전 스트립 — 실제 스트립과 같은 틀에 화살표·토글은 누를 수 없게 두고 이름표와 날짜 칸만 비운다
const StripSkeleton = () => (
  <div className="relative z-20 shrink-0 bg-background px-5 pb-1">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <ArrowButton direction={-1} disabled onClick={() => {}} />
        <span className="text-base font-extrabold">
          <LabelSkeleton />
        </span>
        <ArrowButton direction={1} disabled onClick={() => {}} />
      </div>
      <div aria-hidden className="pointer-events-none">
        <TypeToggle value="WEEK" onChange={() => {}} />
      </div>
    </div>
    <div className="relative mt-1.5 min-h-[72px]">
      <WeekSkeleton />
    </div>
  </div>
);

// 주 스트립 자리표시 — 요일은 고정이라 그대로 쓰고 날짜 칸만 비운다. 크기는 CalendarDay와 맞춘다
const WeekSkeleton = () => (
  <div role="status" aria-label="주 불러오는 중" className="grid grid-cols-7">
    {WEEKDAY_LABELS.map((weekday) => (
      <div
        key={weekday}
        aria-hidden
        className="flex w-full flex-col items-center gap-1 border-2 border-transparent pt-1.5 pb-1"
      >
        <span className="animate-skeleton-flow size-10 rounded-full min-[390px]:size-11" />
        <span className="text-[13px] leading-[1.15] text-muted-foreground">
          {weekday}
        </span>
      </div>
    ))}
  </div>
);
