// 홈 진입 때 띄울 이벤트 공지 — 누구에게 띄울지는 서버(사용자·구독 유형 숨김)가 고르고, 여기서는 이 기기가 이미 반응한 것과 정기 구독자를 한 번 더 거른다.
// 반응 기록은 마운트 때 한 번 읽어 고정한다 — 이번 방문에 닫아도 시트가 닫히는 연출 중에 사라지지 않게
import { useState } from 'react';

import {
  readEventPopupDoneIds,
  unseenPopup,
} from '@/features/event-popup/model/active-popup';
import { useActivePopupQuery } from '@/features/event-popup/model/useActivePopupQuery';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';

import { isEventPopupAudience } from './event-popup-audience';

/** @param skip 이번 방문엔 공지를 띄우지 않는다(다른 흐름이 홈을 차지하는 방문) — 묻지도 않고, 반응 기록을 안 남겨 다음 방문에 뜬다 */
export const useActiveEventPopup = ({ skip = false } = {}) => {
  const [doneIds] = useState(readEventPopupDoneIds);
  const { data, isPending, isFetching, fetchStatus } = useActivePopupQuery({
    enabled: !skip,
  });
  const membership = useSubscriptionQuery();
  if (skip) return { popup: null, loading: false };
  // 지난 방문의 응답이 캐시에 남아 있으면 다시 묻는 동안에도 isPending이 false다 — 이번에 묻는 동안은 모르는 것으로 둔다.
  // 실패(배포 전 404 포함)하거나 묻지 않는 조회(로그인 정보 없음)면 기다리지 않고 공지 없이 지나간다
  const loading =
    isFetching || (isPending && fetchStatus !== 'idle') || membership.isPending;
  // 정기 구독자에게는 띄우지 않는다(서버 숨김과 겹치는 안전망) — 구독 상태를 모르면(조회 실패) 구독자일 수 있으니 띄우지 않는다
  const audience =
    membership.subscription !== null &&
    isEventPopupAudience(membership.subscription);

  return {
    popup: loading || !audience ? null : unseenPopup(data, doneIds),
    loading,
  };
};
