// 헤더의 열매 — 현재 연속 일수를 보여주고 누르면 연속 기록 페이지로 간다
'use client';

import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { STREAK_PATH } from '@/shared/lib/routes';
import { HeaderAction } from '@/shared/ui/HeaderAction';

import { fruitStateOf } from '../model/streak-status';
import { useStreakQuery } from '../model/useStreakQuery';
import { StreakFruit } from './StreakFruit';

// 선 아이콘(18px)보다 작게 잡는다 — 열매는 면으로 칠해져 있어 같은 수치면 더 크게 읽힌다.
// 눈에 띄어야 하는 칸이지만 그건 색이 맡는다. 크기로 키우면 강조가 아니라 정렬 오류로 보인다
const HEADER_FRUIT_SIZE = 16;

// "999일" 세 자리 폭 기준 — 못 받은 동안 라벨 칸을 비워 두면 폭이 좁았다 넓어지며 아이콘이 옆으로 튄다.
// 두 자리까지만 잡으면 스트릭이 100일을 넘는 순간 다시 튄다
const LABEL_MIN_WIDTH = 32;

export const HeaderStreak = () => {
  const { streak, isPending } = useStreakQuery();

  // 조회에 실패해도 자리를 지키고 0일로 그린다 — 홈은 스트릭 없이도 멀쩡히 돌아야 한다.
  // 다만 아직 못 받은 건 실패가 아니다. 여기에도 0일을 쓰면 앱을 켤 때마다
  // 0일을 먼저 그렸다가 응답이 온 순간 숫자가 튄다 — 그럴 바엔 기다렸다 제 숫자를 그린다
  const currentStreakDays = streak?.currentStreakDays ?? 0;
  const activeToday = streak?.activeToday ?? false;
  const state = fruitStateOf({ currentStreakDays, activeToday });

  return (
    <HeaderAction
      href={STREAK_PATH}
      label={isPending ? '' : `${currentStreakDays}일`}
      ariaLabel={
        isPending
          ? '연속 기록 보기'
          : `연속 학습 ${currentStreakDays}일, 연속 기록 보기`
      }
      highlighted={state === 'fresh'}
      labelMinWidth={LABEL_MIN_WIDTH}
      onClick={() =>
        track(EVENTS.STREAK_OPENED, {
          source: 'home_header',
          streak_days: currentStreakDays,
          is_active_today: activeToday,
        })
      }
    >
      <StreakFruit state={state} size={HEADER_FRUIT_SIZE} />
    </HeaderAction>
  );
};
