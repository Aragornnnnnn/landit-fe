// 내 환급 현황 조회 — 환급 상품을 산 사람에게만 뜻이 있어서, 물을지 말지는 부르는 쪽이 정한다
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getMyRewards } from '../api/reward';
import { REWARD_GC_MS, rewardKeys } from './keys';
import { participantOf } from './reward-status';
import { msUntilKstMidnight } from './time-left';

// 서버가 하루를 마감할 틈 — 자정 정각에 물으면 어제 값을 받을 수 있다
const MIDNIGHT_SETTLE_MS = 2_000;

export const useRewardQuery = ({ enabled }: { enabled: boolean }) => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const queryClient = useQueryClient();
  const asks = enabled && userId !== null;

  const { data, dataUpdatedAt, error, isFetched, isFetching, refetch } =
    useQuery({
      queryKey: rewardKeys.summary(userId),
      queryFn: getMyRewards,
      enabled: asks,
      // 헤더가 오래 비지 않게 한 번만 다시 묻는다
      retry: 1,
      // 대화가 길어도 받아 둔 답을 버리지 않는다 — 버리면 완료 뒤 미리받기가 나가지 않는다
      gcTime: REWARD_GC_MS,
    });

  // 화면을 켠 채 자정을 넘기면 오늘과 쌓인 금액이 어제 것으로 남는다 — 하루가 마감되면 다시 받고, 받을 때마다 다음 자정으로 다시 건다
  useEffect(() => {
    if (!asks) return;
    const timer = setTimeout(
      () => void queryClient.invalidateQueries({ queryKey: rewardKeys.all }),
      msUntilKstMidnight(Date.now()) + MIDNIGHT_SETTLE_MS,
    );
    return () => clearTimeout(timer);
  }, [asks, dataUpdatedAt, queryClient]);

  return {
    // 환급에 참여한 적이 없으면 null
    reward: data ? participantOf(data) : null,
    // 무료로 한 대화가 챌린지였다면 받았을 금액 — 무료 대상이 아니면 null. 이 값을 모르는 서버는 필드를 안 보낸다
    preview: data?.preview ?? null,
    // 서버가 이 요약을 계산한 시각 — 서버가 정한 오늘을 여기서 읽는다
    computedAt: data?.computedAt ?? null,
    // 응답을 받았는지 — 받았는데 reward가 null이면 참여자가 아니다
    loaded: data !== undefined,
    // 성공이든 실패든 한 번은 답을 들었는지 — 다시 받는 동안에도 유지된다
    fetched: isFetched,
    // 지금 받는 중인지 — 받아 둔 답이 곧 바뀔 수 있다
    fetching: isFetching,
    error,
    retry: () => void refetch(),
  };
};
