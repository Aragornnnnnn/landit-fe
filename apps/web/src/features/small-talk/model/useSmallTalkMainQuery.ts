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
    // 앱으로 돌아올 때 자동으로 다시 받지 않는다 — 서버가 주제를 매번 새로 뽑아 주기 때문에,
    // 주제 고르기를 열어 둔 채 복귀하면 누르지도 않았는데 읽던 주제가 갈린다.
    // 잔량은 대화를 마칠 때 무효화하고 화면에 들어올 때 다시 받는다
    refetchOnWindowFocus: false,
  });

  return {
    main: data ?? null,
    // 화면을 덮어야 하는 실패 — 받아 둔 게 있으면 재조회가 실패해도 그것으로 그린다.
    // react-query는 재조회가 실패해도 지난 응답을 남기고 error를 다음 성공까지 들고 있어서,
    // 소비자마다 이 판정을 따로 적으면 한쪽만 고쳐져 어긋난다 (홈·대화 화면이 같이 본다)
    fatalError: data ? null : error,
    isLoading: isPending,
    // 다시 받아오기 — 서버는 주제를 요청마다 무작위로 다시 뽑으므로 부를 때마다 다른 주제가 온다.
    // 실패해도 이미 받아 둔 것은 캐시에 그대로 남는다 — 부른 쪽이 결과를 보고 알린다
    refresh: async () => {
      const { isError } = await refetch();
      return { isError };
    },
  };
};
