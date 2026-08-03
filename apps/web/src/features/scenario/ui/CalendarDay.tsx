'use client';

// 달력 한 칸 — 원 하나와 그 아래 이름표. 상태별로 무엇을 그릴지는 dayStateOf가 정한다
import { motion, useReducedMotion } from 'motion/react';

import type { ScenarioCalendarDay } from '../api/calendar';
import { dayStateOf, isOpenable, type DayState } from '../lib/day-state';
import { SHIMMER } from '../lib/shimmer';

// 원 안쪽 배경 — 완료한 날은 사진이 덮으므로 회색은 사진 로딩 전 자리만 지킨다
const MARK_STYLE: Record<DayState, string> = {
  completed: 'bg-secondary',
  today: 'bg-primary',
  missed: 'bg-secondary',
  // 테두리도 배경도 두지 않는다 — 놓친 날과 헷갈리지 않게
  blank: 'bg-transparent',
};

const LABEL_STYLE: Record<DayState, string> = {
  // 한 날은 진하게, 안 한 날은 옅게 — 한눈에 갈려야 한다
  completed: 'font-semibold text-muted-foreground',
  today: 'font-black text-primary',
  missed: 'font-semibold text-muted-foreground/50',
  blank: 'font-semibold text-muted-foreground/40',
};

interface CalendarDayProps {
  day: ScenarioCalendarDay;
  // 서버 기준 오늘
  today: string;
  // 처음 완료한 날. 그 앞은 기록 자체가 없어 자리만 비워 둔다
  startedAt: string | null;
  // 지금 카드로 보고 있는 날
  selected: boolean;
  onSelect: (date: string) => void;
}

export const CalendarDay = ({
  day,
  today,
  startedAt,
  selected,
  onSelect,
}: CalendarDayProps) => {
  const reduced = useReducedMotion() ?? false;
  const state = dayStateOf(day, { today, startedAt });
  const dayNumber = Number(day.date.slice(8));

  return (
    <button
      type="button"
      disabled={!isOpenable(state)}
      onClick={() => onSelect(day.date)}
      aria-label={`${Number(day.date.slice(5, 7))}월 ${dayNumber}일${
        state === 'completed' ? ' 완료' : state === 'today' ? ' 오늘' : ''
      }`}
      aria-current={selected ? 'date' : undefined}
      // 테두리는 늘 자리를 차지한다 — 선택할 때만 넣으면 칸이 밀린다
      className={`flex w-full flex-col items-center gap-1 rounded-[16px] border-2 pt-1.5 pb-1 disabled:cursor-default ${
        selected ? 'border-primary' : 'border-transparent'
      }`}
    >
      <span
        className={`relative flex size-10 items-center justify-center overflow-hidden rounded-full transition-transform active:scale-95 min-[390px]:size-11 ${MARK_STYLE[state]}`}
      >
        {state === 'completed' && day.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 백엔드 썸네일 도메인이 미정이라 next/image 원격 허용 목록을 아직 못 만든다 (ScenarioCard와 같은 이유)
          <img
            src={day.thumbnailUrl}
            alt=""
            className="size-full object-cover"
          />
        )}

        {state === 'today' && (
          <>
            {/* 표면을 훑는 빛 — 오늘 카드와 같은 박자라 둘이 한 짝으로 읽힌다.
                기울인 만큼 위아래로 빼야 회전해도 모서리가 안 잘린다 */}
            {!reduced && (
              <motion.span
                aria-hidden
                className="absolute -inset-y-1/2 -left-1/2 w-1/2 rotate-12 bg-linear-to-r from-transparent via-white/55 to-transparent"
                animate={{ x: ['0%', '460%'] }}
                transition={{ ...SHIMMER, repeat: Infinity }}
              />
            )}
            <span className="relative text-lg font-black text-primary-foreground">
              ?
            </span>
          </>
        )}
      </span>

      {/* 오늘은 숫자 대신 이름표를 쓴다 — 원 위에 배지를 얹으면 사진을 가린다 */}
      <span
        className={`text-[13px] leading-[1.15] ${
          selected ? 'font-black text-primary' : LABEL_STYLE[state]
        }`}
      >
        {state === 'today' ? '오늘' : dayNumber}
      </span>
    </button>
  );
};
