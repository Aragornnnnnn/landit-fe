'use client';

// 시나리오 완료 축하 화면이 받은 금액을 보여 줄지 묻는 자리 — 완료 순간에 영수증에서 적어 둔 것(refresh-reward 참고)을 읽는다
import { useQueryClient } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import type { CompletionEarn } from './completion-earn';
import { rewardKeys } from './keys';

/** @param enabled 방금 끝낸 것이 환급이 쌓이는 대화(시나리오)인가. 아니면 적어 둔 것을 읽지 않는다 — 앞서 끝낸 시나리오의 것이 남아 있을 수 있다 */
export const useCompletionEarn = ({ enabled }: { enabled: boolean }) => {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  // 적는 쪽이 화면 전환보다 먼저 끝나므로 구독하지 않고 그때의 값을 그대로 읽는다
  const earn = enabled
    ? (queryClient.getQueryData<CompletionEarn | null>(
        rewardKeys.completionEarn(userId),
      ) ?? null)
    : null;

  return { earn };
};
