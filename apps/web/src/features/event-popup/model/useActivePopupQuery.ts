// 지금 띄울 이벤트 공지 조회 — 홈에 들어올 때마다 서버가 고른 공지 하나를 묻는다
import { useQuery } from '@tanstack/react-query';

import { getActivePopup } from '../api/event-popup';

export const eventPopupKeys = {
  active: ['event-popup', 'active'] as const,
};

/** @param enabled 이번 방문에 공지를 띄우지 않을 거면 끄고 묻지 않는다 */
export const useActivePopupQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: eventPopupKeys.active,
    queryFn: getActivePopup,
    enabled,
    // 공지가 없거나 서버가 아직 이 API를 모르면(배포 전) 바로 포기한다 — 기다리는 동안 램프가 멈춰 있다
    retry: false,
    refetchOnWindowFocus: false,
  });
