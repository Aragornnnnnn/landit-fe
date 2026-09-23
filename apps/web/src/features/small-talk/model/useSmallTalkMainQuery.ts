// 스몰톡 홈 조회 상태 — 고를 주제와 오늘 남은 말하기 예산을 한 번에 받는다 (백엔드가 부르는 이름 그대로 main)
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getSmallTalkTopics } from '../api/small-talk';
import { smallTalkKeys } from './keys';

export const useSmallTalkMainQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: smallTalkKeys.main(userId),
    queryFn: getSmallTalkTopics,
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    enabled: userId !== null,
  });

  return {
    main: data ?? null,
    error,
    isLoading: isPending,
    // 다시 받아오기 — 서버는 주제를 요청마다 무작위로 다시 뽑으므로 부를 때마다 다른 주제가 온다.
    // 실패해도 이미 받아 둔 것은 캐시에 그대로 남는다 — 부른 쪽이 결과를 보고 알린다
    refresh: async () => {
      const { isError } = await refetch();
      return { isError };
    },
  };
};
