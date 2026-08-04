// 헤더의 열매 — 현재 연속 일수를 보여주고 누르면 연속 기록 페이지로 간다
'use client';

import { EVENTS } from '@landit/analytics';
import Link from 'next/link';

import { track } from '@/shared/analytics';
import { STREAK_PATH } from '@/shared/lib/routes';

import { fruitStateOf } from '../model/streak-status';
import { useStreakQuery } from '../model/useStreakQuery';
import { StreakFruit } from './StreakFruit';

export const HeaderStreak = () => {
  const streak = useStreakQuery();

  // 조회 전·실패에도 자리를 지키고 0일로 그린다 — 홈은 스트릭 없이도 멀쩡히 돌아야 한다
  const currentStreakDays = streak?.currentStreakDays ?? 0;
  const activeToday = streak?.activeToday ?? false;
  const state = fruitStateOf({ currentStreakDays, activeToday });

  return (
    <Link
      href={STREAK_PATH}
      onClick={() =>
        track(EVENTS.STREAK_OPENED, {
          source: 'home_header',
          streak_days: currentStreakDays,
          is_active_today: activeToday,
        })
      }
      aria-label={`연속 학습 ${currentStreakDays}일, 연속 기록 보기`}
      className="flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-muted-foreground transition-all active:scale-90 active:bg-secondary"
    >
      <StreakFruit state={state} size={22} />
      <span
        className={`text-[10px] font-medium whitespace-nowrap ${
          state === 'fresh' ? 'text-primary' : ''
        }`}
      >
        {currentStreakDays}일
      </span>
    </Link>
  );
};
