// 스몰톡 홈 조회 상태 — 고를 주제와 오늘 남은 발화 예산을 한 번에 받는다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getFreeTalkMain } from '../api/free-talk';
import { smallTalkKeys } from './keys';

export const useFreeTalkMainQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: smallTalkKeys.main(userId),
    queryFn: getFreeTalkMain,
    // 로그아웃 직후 리다이렉트 전 한 프레임에 userId 없는 키로 fetch가 나가는 것을 막는다
    enabled: userId !== null,
  });

  return {
    main: data ?? null,
    error,
    isLoading: isPending,
    retry: () => void refetch(),
  };
};
