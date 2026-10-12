'use client';

// 시나리오 완료 축하 화면이 받은 금액을 보여 줄지 묻는 자리 — 완료 순간에 적어 둔 것(refresh-reward 참고)과 새로 받은 환급을 맞춰 본다
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { completionEarnOf, type EarnBase } from './completion-earn';
import { rewardKeys } from './keys';
import { useRewardQuery } from './useRewardQuery';

/** @param enabled 방금 끝낸 것이 환급이 쌓이는 대화(시나리오)인가. 아니면 적어 둔 것을 읽지 않는다 — 앞서 끝낸 시나리오의 것이 남아 있을 수 있다 */
export const useCompletionEarn = ({ enabled }: { enabled: boolean }) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);
  const queryClient = useQueryClient();
  // 적는 쪽이 화면 전환보다 먼저 끝나므로 구독하지 않고 그때의 값을 그대로 읽는다
  const base = enabled
    ? (queryClient.getQueryData<EarnBase | null>(rewardKeys.earnBase(userId)) ??
      null)
    : null;
  // 적어 둔 것이 없으면 환급과 상관없거나 받을 것이 없는 완료다 — 묻지 않는다
  const { reward, fetching } = useRewardQuery({ enabled: base !== null });
  const earn = completionEarnOf(reward, base);

  return {
    earn,
    // 새 금액을 받는 중이다 — 열매를 먼저 그렸다가 동전으로 바꾸지 않게 그동안은 자리를 비워 둔다
    pending: base !== null && earn === null && fetching,
  };
};
