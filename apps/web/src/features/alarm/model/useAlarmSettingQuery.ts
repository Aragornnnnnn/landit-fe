'use client';

// 알람 설정(시각·켜짐) 조회 — 서버 값이 단일 출처다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getMyAlarm } from '../api/alarm';
import { alarmKeys } from './keys';
import { isAlarmShell } from './shell-alarm';

export const useAlarmSettingQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  return useQuery({
    queryKey: alarmKeys.mine(userId),
    queryFn: getMyAlarm,
    enabled: userId !== null && isAlarmShell(),
    // 저장할 때 캐시를 직접 갱신한다 — 앱 복귀마다 다시 받을 이유가 없다
    staleTime: Infinity,
    retry: 1,
  });
};
