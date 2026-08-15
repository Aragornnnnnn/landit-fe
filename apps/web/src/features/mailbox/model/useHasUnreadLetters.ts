// 헤더에 미읽음 점을 켤지 — 안 읽은 편지 개수를 묻고 하나라도 있으면 켠다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getUnreadCount } from '../api/mailbox';
import { mailboxKeys } from './keys';

export const useHasUnreadLetters = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data } = useQuery({
    queryKey: mailboxKeys.unread(userId),
    queryFn: getUnreadCount,
    enabled: userId !== null,
    // 안 읽은 편지가 생기는 건 운영이 편지를 보낼 때뿐이라 며칠에 한 번이다.
    // 전역 기본값(30초)을 그대로 두면 앱을 켤 때마다, 웹뷰로 돌아올 때마다 헤더가 요청을 보낸다.
    // 점이 사라지는 쪽은 편지를 읽는 그 자리에서 직접 걷어내므로 늦을 일이 없다
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    // 조회가 실패해도 헤더는 그대로 돌아야 하므로 에러를 밖으로 내보내지 않는다.
    // 점이 안 뜨는 건 편지가 없다는 뜻과 구분되지 않지만, 그 차이로 할 일이 없다
    retry: 1,
  });

  return (data?.unreadCount ?? 0) > 0;
};
