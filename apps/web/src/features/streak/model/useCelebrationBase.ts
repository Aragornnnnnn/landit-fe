// 축하 연출의 출발점 — 완료 순간에 심어 둔 값을 읽기만 한다 (refresh-streak 참고)
// 대화 화면과 축하 화면이 갈려 있어 props로는 못 넘긴다. 캐시에 두면 계정 스코프와 로그아웃 정리를 그대로 물려받는다.
// 심는 쪽이 화면 전환보다 먼저 끝나므로 구독하지 않고 그때의 값을 그대로 읽는다
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import type { StreakBase } from './celebration';
import { streakKeys } from './keys';

export const useCelebrationBase = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();

  return (
    queryClient.getQueryData<StreakBase | null>(
      streakKeys.celebrationBase(userId),
    ) ?? null
  );
};
