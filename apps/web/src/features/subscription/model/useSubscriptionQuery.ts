// 내 구독 상태 쿼리 — 로그인 사용자만 조회한다. 실패해도 화면은 돌아야 하므로 에러는 밖으로 내보내지 않는다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getMySubscription } from '../api/subscription';
import { subscriptionKeys } from './keys';

export const useSubscriptionQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, isPending, isError } = useQuery({
    queryKey: subscriptionKeys.mine(userId),
    queryFn: getMySubscription,
    enabled: userId !== null,
    retry: 1,
  });

  return {
    subscription: data ?? null,
    isPending: userId !== null && isPending,
    // 조회 실패(구독 API 미배포 포함) — 게이트는 이걸 보고 잠그지 않는 쪽을 고른다
    isError,
  };
};
