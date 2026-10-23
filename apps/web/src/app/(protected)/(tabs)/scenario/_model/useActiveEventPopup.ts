// 홈 진입 때 띄울 이벤트 공지 — 서버가 고른 공지에서 이 기기가 이미 반응한 것과 정기 구독자를 거른다.
// 반응 기록은 마운트 때 한 번 읽어 고정한다 — 이번 방문에 닫아도 시트가 닫히는 연출 중에 사라지지 않게
import { useState } from 'react';

import {
  readEventPopupDoneIds,
  unseenPopup,
} from '@/features/event-popup/model/active-popup';
import { useActivePopupQuery } from '@/features/event-popup/model/useActivePopupQuery';
import { useSubscriptionQuery } from '@/features/subscription/model/my-subscription/useSubscriptionQuery';

import { isEventPopupAudience } from './event-popup-audience';

export const useActiveEventPopup = () => {
  const [doneIds] = useState(readEventPopupDoneIds);
  const { data, isPending, isFetching } = useActivePopupQuery();
  const membership = useSubscriptionQuery();
  // 지난 방문의 응답이 캐시에 남아 있으면 다시 묻는 동안에도 isPending이 false다 — 이번에 묻는 동안은 모르는 것으로 둔다.
  // 실패(배포 전 404 포함)하면 묻기가 끝나 공지 없이 지나간다
  const loading = isPending || isFetching || membership.isPending;
  // 정기 구독자에게는 띄우지 않는다 — 구독 상태를 모르면(조회 실패) 구독자일 수 있으니 띄우지 않는다
  const audience =
    membership.subscription !== null &&
    isEventPopupAudience(membership.subscription);

  return {
    popup: loading || !audience ? null : unseenPopup(data, doneIds),
    loading,
  };
};
