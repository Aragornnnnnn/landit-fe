// 결제 이력 쿼리 — 결제 내역 화면만 쓴다. 로그인 사용자만 조회한다
import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getSubscriptionEvents } from '../../api/subscription';
import { subscriptionKeys } from './keys';

export const useSubscriptionEventsQuery = () => {
  const userId = useCurrentUserId();

  const { data, isPending, isError } = useQuery({
    queryKey: subscriptionKeys.events(userId),
    queryFn: getSubscriptionEvents,
    enabled: userId !== null,
    retry: 1,
  });

  return {
    events: data ?? [],
    isPending: userId !== null && isPending,
    isError,
  };
};
