// 연속 학습 기록 화면 전체 — 히어로·달력·누적 기록을 한 번의 달력 조회로 채운다
'use client';

import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';
import { SCENARIO_PATH } from '@/shared/lib/routes';
import { useScrollShadow } from '@/shared/lib/useScrollShadow';
import { Button } from '@/shared/ui/Button';
import { ChevronLeftIcon } from '@/shared/ui/Icons';

import { useStreakCalendar } from '../model/useStreakCalendar';
import { StreakCalendar, type StreakCalendarProps } from './StreakCalendar';
import { StreakHero } from './StreakHero';
import { StreakStats } from './StreakStats';

export const StreakFlow = () => {
  const router = useRouter();
  const { ref: scrollRef, onScroll, hasShadow } = useScrollShadow();
  const {
    today,
    view,
    calendar,
    error,
    canGoBack,
    canGoForward,
    goMonth,
    retry,
  } = useStreakCalendar();

  const changeMonth = (direction: -1 | 1) => {
    track(EVENTS.STREAK_MONTH_CHANGED, {
      direction: direction === -1 ? 'prev' : 'next',
      year: view.year,
      month: view.month,
    });
    goMonth(direction);
  };

  const retryAfterError = () => {
    track(EVENTS.ERROR_RETRIED, { screen: 'streak' });
    retry();
  };

  return (
    <main className="mx-auto flex h-dvh max-w-[430px] flex-col bg-background">
      <TopBar
        hasShadow={hasShadow}
        onBack={() => router.replace(SCENARIO_PATH)}
      />

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto"
      >
        {/* 달력이 있으면 달력이 이긴다 — 달을 넘기다 실패해도 보고 있던 달은 그대로 둔다 */}
        {calendar ? (
          <LoadedRecord
            view={view}
            today={today}
            calendar={calendar}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoMonth={changeMonth}
          />
        ) : error ? (
          <ErrorNotice message={error.message} onRetry={retryAfterError} />
        ) : (
          <Skeleton />
        )}
      </div>
    </main>
  );
};

const TopBar = ({
  hasShadow,
  onBack,
}: {
  hasShadow: boolean;
  onBack: () => void;
}) => (
  <header
    className="relative flex shrink-0 items-center bg-background px-4 pt-[max(env(safe-area-inset-top),16px)] pb-2 transition-shadow duration-200"
    style={{ boxShadow: hasShadow ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}
  >
    <button
      type="button"
      onClick={onBack}
      aria-label="뒤로 가기"
      className="-ml-1 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-90 active:bg-secondary"
    >
      <ChevronLeftIcon size={24} />
    </button>
    <h1 className="absolute left-1/2 -translate-x-1/2 text-[18px] font-bold text-foreground">
      연속 학습 기록
    </h1>
  </header>
);

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

const ErrorNotice = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center gap-4 px-6 pt-24 text-center">
    <p className="text-muted-foreground">{message}</p>
    <Button
      variant="secondary"
      size="sm"
      className="w-auto px-6"
      onClick={onRetry}
    >
      다시 시도
    </Button>
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
