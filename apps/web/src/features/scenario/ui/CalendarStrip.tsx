'use client';

// 날짜 스트립 — 접으면 한 주, 펼치면 한 달. 누르면 그날 카드로 간다
import { useEffect, useRef, useState } from 'react';
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
  shiftWindow,
  WEEKDAY_LABELS,
  weekdayIndexOf,
} from '../lib/calendar-window';
import { useScenarioCalendarQuery } from '../model/useScenarioCalendarQuery';
import { CalendarDay } from './CalendarDay';

// 그 달 1일이 몇 번째 칸에서 시작하는지
const leadingBlanks = (firstDate: string) => weekdayIndexOf(firstDate);

interface CalendarStripProps {
  // 주소가 정한 창. 없으면 서버가 오늘이 든 창을 준다
  windowDate?: string;
  // 지금 카드로 보고 있는 날. 응답 전이면 null
  selected: string | null;
  // 오늘을 고르면 null을 준다 — 오늘은 날짜로 지목하는 날이 아니라 기본값이다
  onSelect: (date: string | null) => void;
}

export const CalendarStrip = ({
  windowDate: routeDate,
  selected,
  onSelect,
}: CalendarStripProps) => {
  const reduced = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  // 창은 보고 있는 날과 따로 움직인다 — 지난 주를 훑어보다 아무 날도 안 고를 수 있다
  const [movedTo, setMovedTo] = useState<string | undefined>(undefined);
  const windowDate = movedTo ?? routeDate;
  // 펼치는 동안 날을 골랐는지. 접을 때 어디로 돌아갈지 판단한다
  const picked = useRef(false);
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
      setMovedTo(picked.current ? undefined : collapsedFrom);
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
  const { calendar: week } = useScenarioCalendarQuery(
    'WEEK',
    expanded ? collapsedFrom : windowDate,
  );
  const { calendar: month } = useScenarioCalendarQuery(
    'MONTH',
    windowDate,
    expanded,
  );

  if (!week) return <div className="h-[104px] shrink-0" />;

  // 라벨과 이동 한계는 지금 보고 있는 단위에서 가져온다
  const shown = expanded ? (month ?? week) : week;
  const { today, startedAt } = shown;
  const type: ScenarioCalendarType = expanded ? 'MONTH' : 'WEEK';
  const anchor = windowDate ?? today;

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
      picked.current = false;
    } else {
      // 달에서 날을 골랐으면 주소가 이미 그 날이라 창을 비워 따라가게 두고,
      // 아무것도 안 골랐으면 펼치기 전 주로 되돌린다
      setMovedTo(picked.current ? undefined : collapsedFrom);
    }
    setExpanded(next === 'MONTH');
  };

  const selectDay = (day: string) => {
    track(EVENTS.CALENDAR_DATE_SELECTED, { is_today: day === today });
    picked.current = true;
    onSelect(day === today ? null : day);
  };

  return (
    // 달 보기는 카드를 밀어내지 않고 그 위에 겹쳐 뜬다 — 카드가 눌리면 오늘 할 일이 작아 보인다
    <div className="relative z-20 shrink-0 bg-background px-5 pt-1 pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ArrowButton
            direction={-1}
            disabled={!canGoBack(anchor, type, startedAt)}
            onClick={() => move(-1)}
          />
          <span className="text-base font-extrabold text-foreground">
            {shown.label}
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
      <div className="relative mt-3 min-h-[72px]">
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

        <AnimatePresence>
          {expanded && (
            <>
              {/* 바깥을 누르면 접힌다 — 토글을 다시 찾아가지 않아도 되게 */}
              <motion.button
                type="button"
                aria-label="달력 닫기"
                onClick={() => toggle('WEEK')}
                className="absolute inset-x-0 top-0 h-screen cursor-default bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.base, ease: EASE_STANDARD }}
              />

              <motion.div
                className="absolute -inset-x-5 -top-3 overflow-hidden rounded-b-[24px] bg-background shadow-[0_14px_14px_0_rgba(26,20,13,0.2)]"
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
                    <MonthSkeleton />
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

// 달 격자와 같은 골격의 5주 스켈레톤 — 응답이 와도 높이가 안 튀게 칸 치수를 CalendarDay에 맞춘다
const MonthSkeleton = () => (
  <div
    role="status"
    aria-label="달력 불러오는 중"
    className="grid animate-pulse grid-cols-7 gap-y-0.5"
  >
    {Array.from({ length: 35 }).map((_, index) => (
      <span
        key={index}
        className="flex w-full flex-col items-center gap-1 border-2 border-transparent pt-1.5 pb-1"
      >
        <span className="size-10 rounded-full bg-secondary min-[390px]:size-11" />
        <span className="h-[15px] w-4 rounded bg-secondary" />
      </span>
    ))}
  </div>
);

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
