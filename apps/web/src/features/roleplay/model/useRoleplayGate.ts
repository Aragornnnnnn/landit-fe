// 롤플레이 입구 — 페이월에 잠긴 사용자라도 계정당 1회 무료 기회가 남았으면 들여보낸다
// 응답 전에는 잠그지 않는다. 시작하면 서버가 다시 판단하고, 거절하면 페이월로 보낸다
'use client';

import type { PaywallGateSource } from '@landit/analytics';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplayAccess } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useRoleplayGate = () => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const paywall = usePaywallGate();
  const { data, isError } = useQuery({
    queryKey: roleplayKeys.access(userId),
    queryFn: getRoleplayAccess,
    enabled: paywall.locked,
  });

  const canStart = data?.canStart ?? !isError;
  const locked = paywall.locked && !canStart;

  const guard = (
    go: () => void,
    options: { source: PaywallGateSource; returnTo: string },
  ) => {
    if (paywall.locked && canStart) {
      go();
      return;
    }
    paywall.guard(go, options);
  };

  return {
    locked,
    // 이번 시작이 무료 기회를 쓰는가 — 세션을 미리 열면 대화 전에 기회가 사라진다
    usesFreeTrial: paywall.locked && canStart,
    // 서버가 거절했으면 가진 값이 낡은 것이다 — 다음 입구가 바로 페이월로 가게 한다
    refresh: () =>
      void queryClient.invalidateQueries({
        queryKey: roleplayKeys.access(userId),
      }),
    guard,
  };
};
