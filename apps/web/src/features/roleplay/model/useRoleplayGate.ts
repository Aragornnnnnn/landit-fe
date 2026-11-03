// 롤플레이 입구 — 페이월에 잠긴 사용자라도 계정당 1회 무료 기회가 남았으면 들여보낸다
// 응답 전에는 잠그지 않는다. 시작하면 서버가 다시 판단하고, 거절하면 페이월로 보낸다
'use client';

import type { PaywallGateSource } from '@landit/analytics';
import { useQuery } from '@tanstack/react-query';

import { usePaywallGate } from '@/features/subscription/model/paywall-gate/usePaywallGate';
import { useCurrentUserId } from '@/shared/auth/current-member';

import { getRoleplayAccess } from '../api/roleplay';
import { roleplayKeys } from './keys';

export const useRoleplayGate = () => {
  const userId = useCurrentUserId();
  const paywall = usePaywallGate();
  const { data, isError, isPending } = useQuery({
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

  return { locked, deciding: paywall.locked && isPending, guard };
};
