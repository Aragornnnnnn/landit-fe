// 연속 학습 기록 화면 전체 — 히어로·달력·누적 기록을 한 번의 달력 조회로 채운다
'use client';

import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { homePath } from '@/shared/lib/last-tab';
import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { BackHeader } from '@/shared/ui/BackHeader';
import { RetryNotice } from '@/shared/ui/RetryNotice';

import { useStreakCalendar } from '../model/useStreakCalendar';
import {
  StreakCalendar,
  type StreakCalendarProps,
} from './calendar/StreakCalendar';
import { StreakHero } from './flow/StreakHero';
import { StreakStats } from './flow/StreakStats';

export const StreakFlow = () => {
  const router = useRouter();
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();
  const {
    calendar,
    error,
    canGoBack,
    canGoForward,
    isSwitching,
    goMonth,
    retry,
  } = useStreakCalendar();

  // 화살표는 달력이 그려진 뒤에만 눌린다
  const changeMonth = (direction: -1 | 1) => {
    if (calendar === null) return;

    // 떠나는 달을 남긴다
    track(EVENTS.STREAK_MONTH_CHANGED, {
      direction: direction === -1 ? 'prev' : 'next',
      year: calendar.year,
      month: calendar.month,
    });
    goMonth(direction);
  };

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <BackHeader
        title="연속 학습 기록"
        hasShadow={hasShadow}
        onBack={() => router.replace(homePath())}
      />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* 달력이 있으면 달력이 이긴다 — 달을 넘기다 실패해도 보고 있던 달은 그대로 둔다 */}
        {calendar ? (
          <LoadedRecord
            calendar={calendar}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoMonth={changeMonth}
            isSwitching={isSwitching}
          />
        ) : error ? (
          <RetryNotice
            screen="streak"
            message={error.message}
            onRetry={retry}
          />
        ) : (
          <Skeleton />
        )}
      </div>
    </main>
  );
};

const LoadedRecord = (props: StreakCalendarProps) => (
  <div className="pb-8">
    <StreakHero
      currentStreakDays={props.calendar.currentStreakDays}
      activeToday={props.calendar.activeToday}
      totalActiveDays={props.calendar.totalActiveDays}
    />
    <StreakCalendar {...props} />
    {/* 이 화면의 주인공은 달력 — 누적 기록은 그 아래 한 줄로 조용히 둔다 */}
    <div className="mt-5">
      <StreakStats
        longestStreakDays={props.calendar.longestStreakDays}
        totalActiveDays={props.calendar.totalActiveDays}
      />
    </div>
  </div>
);

// 실제 화면과 같은 높이의 회색 덩어리 — 도착 후 레이아웃이 튀지 않게 자리를 먼저 잡는다
const Skeleton = () => (
  <div className="animate-pulse px-5 pt-4">
    <div className="mx-auto size-[100px] rounded-full bg-secondary" />
    <div className="mx-auto mt-2 h-9 w-40 rounded-lg bg-secondary" />
    <div className="mx-auto mt-1.5 h-4 w-48 rounded-lg bg-secondary" />
    <div className="mt-7 h-[400px] rounded-[20px] bg-secondary" />
  </div>
);
