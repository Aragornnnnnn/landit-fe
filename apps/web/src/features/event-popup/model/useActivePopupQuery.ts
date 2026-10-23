// 지금 띄울 이벤트 공지 조회 — 홈에 들어올 때마다 서버가 이 사용자에게 고른 공지 하나를 묻는다
import { useQuery } from '@tanstack/react-query';

import { useCurrentUserId } from '@/shared/auth/current-member';

import { getActivePopup } from '../api/event-popup';

// 서버가 사용자·구독 유형별로 숨김을 걸러 응답이 사람마다 다르다 — 계정이 바뀌면 다른 캐시를 보게 userId를 키에 넣는다
export const eventPopupKeys = {
  active: (userId: number | null) => ['event-popup', userId, 'active'] as const,
};

/** @param enabled 이번 방문에 공지를 띄우지 않을 거면 끄고 묻지 않는다 */
export const useActivePopupQuery = ({ enabled = true } = {}) => {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: eventPopupKeys.active(userId),
    queryFn: getActivePopup,
    enabled: enabled && userId !== null,
    // 공지가 없거나 서버가 아직 이 API를 모르면(배포 전) 바로 포기한다 — 기다리는 동안 공지 뒤 시트가 멈춰 있다
    retry: false,
    refetchOnWindowFocus: false,
  });
};
