'use client';

// 자정이 가까워 급한 때인지 알려 준다 — 초마다 다시 그리지 않고, 급함이 바뀌는 순간에만 한 번 깨어난다
import { useSyncExternalStore } from 'react';

import { isUrgent, msUntilKstMidnight, msUntilUrgentChange } from './time-left';

const urgentNow = () => isUrgent(msUntilKstMidnight(Date.now()));

// 값을 들고 있지 않고 볼 때마다 시계를 읽는다 — 꺼져 있던 동안의 예전 값이 남지 않는다
const subscribe = (onChange: () => void) => {
  let timer: ReturnType<typeof setTimeout>;
  // 값이 바뀌지 않았어도 다음 경계로 다시 건다 — 타이머가 조금 일찍 울려도 사슬이 끊기지 않는다
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(
      resync,
      msUntilUrgentChange(msUntilKstMidnight(Date.now())),
    );
  };
  const resync = () => {
    onChange();
    arm();
  };
  arm();
  // 앱이 뒤에 가 있던 동안 밀린 타이머를 돌아왔을 때 바로잡는다
  document.addEventListener('visibilitychange', resync);

  return () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', resync);
  };
};

// 꺼 둔 동안은 늘 false — 걸린 금액이 없으면 급할 일도 없다
export const useMidnightUrgent = (enabled: boolean) => {
  const urgent = useSyncExternalStore(subscribe, urgentNow, () => false);
  return enabled && urgent;
};
