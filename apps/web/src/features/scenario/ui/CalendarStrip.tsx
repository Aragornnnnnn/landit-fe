'use client';

// 날짜 스트립 — 접으면 한 주, 펼치면 한 달. 누르면 그날 카드로 간다
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { DURATION, EASE_STANDARD } from '@/shared/motion';

import type { ScenarioCalendarType } from '../api/calendar';
import { canGoBack, canGoForward, shiftWindow } from '../lib/calendar-window';
import { useScenarioCalendarQuery } from '../model/useScenarioCalendarQuery';
import { CalendarDay } from './CalendarDay';

// 일요일 시작 — 서버가 주 창을 일요일부터 내려주는 것과 맞춘다
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 그 달 1일이 몇 번째 칸에서 시작하는지
const leadingBlanks = (firstDate: string) =>
  new Date(`${firstDate}T00:00:00Z`).getUTCDay();

interface CalendarStripProps {
  // 지금 카드로 보고 있는 날. 아직 정해지기 전이면 null
  date: string | null;
  // 오늘을 고르면 null을 준다 — 오늘은 날짜로 지목하는 날이 아니라 기본값이다
  onSelect: (date: string | null) => void;
}

export const CalendarStrip = ({ date, onSelect }: CalendarStripProps) => {
  const reduced = useReducedMotion() ?? false;
  const [expanded, setExpanded] = useState(false);
  // 창은 보고 있는 날과 따로 움직인다 — 지난 주를 훑어보다 아무 날도 안 고를 수 있다.
  // 생략하면 서버가 오늘이 든 창을 준다
  const [windowDate, setWindowDate] = useState<string | undefined>(
    date ?? undefined,
  );
  // 펼치기 직전 상태 — 접을 때 어디로 돌아갈지 판단한다
  const collapsedFrom = useRef<{ windowDate?: string; date: string | null }>({
    date: null,
  });

  // 스트립과 패널은 서로 다른 창을 본다. 조회 하나를 돌려 쓰면 펼치는 순간
  // 주 스트립이 그릴 것을 잃어 번쩍인다
  const { calendar: week } = useScenarioCalendarQuery('WEEK', windowDate);
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

  const move = (direction: -1 | 1) =>
    setWindowDate(shiftWindow(anchor, type, direction));

  const toggle = (next: ScenarioCalendarType) => {
    if (next === 'MONTH') {
      collapsedFrom.current = { windowDate, date };
    } else {
      // 달에서 날을 골랐으면 그 날이 든 주로, 아무것도 안 골랐으면 펼치기 전 주로
      const picked = date !== collapsedFrom.current.date;
      setWindowDate(
        picked ? (date ?? undefined) : collapsedFrom.current.windowDate,
      );
    }
    setExpanded(next === 'MONTH');
  };

  const selectDay = (picked: string) =>
    onSelect(picked === today ? null : picked);

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
              selected={day.date === date}
              onSelect={selectDay}
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
                    {WEEKDAYS.map((weekday) => (
                      <span
                        key={weekday}
                        className="text-xs font-bold text-muted-foreground/60"
                      >
                        {weekday}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-0.5">
                    {/* 1일이 실제 요일 칸에 서야 한다 — 앞을 빈 칸으로 채운다 */}
                    {Array.from({
                      length: leadingBlanks(shown.days[0].date),
                    }).map((_, index) => (
                      <span key={`blank-${index}`} />
                    ))}

                    {shown.days.map((day) => (
                      <CalendarDay
                        key={day.date}
                        day={day}
                        today={today}
                        startedAt={startedAt}
                        selected={day.date === date}
                        onSelect={selectDay}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
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
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden>
      <path
        d={direction === -1 ? 'M7 1 1 7l6 6' : 'M1 1l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
        className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors ${
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
