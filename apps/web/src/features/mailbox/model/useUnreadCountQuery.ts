// 안 읽은 편지 개수 조회 — 헤더는 하나라도 있는지만 본다
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/auth/auth-store';

import { getUnreadCount } from '../api/mailbox';
import { mailboxKeys } from './keys';

// 안 읽은 편지가 생기는 건 운영이 편지를 보낼 때뿐이라 며칠에 한 번이다
const UNREAD_STALE_TIME = 10 * 60_000;

export const useUnreadCountQuery = () => {
  const userId = useAuthStore((state) => state.member?.userId ?? null);

  const { data } = useQuery({
    queryKey: mailboxKeys.unread(userId),
    queryFn: getUnreadCount,
    enabled: userId !== null,
    // 전역 기본값(30초)을 그대로 두면 앱을 켤 때마다, 웹뷰로 돌아올 때마다 헤더가 요청을 보낸다.
    // 점이 사라지는 쪽은 편지를 읽는 자리에서 다시 묻게 하므로 늦을 일이 없다
    staleTime: UNREAD_STALE_TIME,
    refetchOnWindowFocus: false,
    // 조회가 실패해도 헤더는 그대로 돌아야 하므로 에러를 밖으로 내보내지 않는다.
    // 점이 안 뜨는 건 편지가 없다는 뜻과 구분되지 않지만, 그 차이로 할 일이 없다
    retry: 1,
  });

  return { hasUnread: (data?.unreadCount ?? 0) > 0 };
};
