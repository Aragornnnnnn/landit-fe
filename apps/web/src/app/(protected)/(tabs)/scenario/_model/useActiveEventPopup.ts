// 홈 진입 때 띄울 이벤트 공지 — 서버가 고른 공지에서 이 기기가 이미 반응한 것을 거른다.
// 반응 기록은 마운트 때 한 번 읽어 고정한다 — 이번 방문에 닫아도 시트가 닫히는 연출 중에 사라지지 않게
import { useState } from 'react';

import {
  readEventPopupDoneIds,
  unseenPopup,
} from '@/features/event-popup/model/active-popup';
import { useActivePopupQuery } from '@/features/event-popup/model/useActivePopupQuery';

export const useActiveEventPopup = () => {
  const [doneIds] = useState(readEventPopupDoneIds);
  const { data, isPending, isFetching } = useActivePopupQuery();
  // 지난 방문의 응답이 캐시에 남아 있으면 다시 묻는 동안에도 isPending이 false다 —
  // 그 사이 램프가 먼저 나서거나 내려간 공지가 뜨지 않게, 이번에 묻는 동안은 모르는 것으로 둔다.
  // 실패(배포 전 404 포함)하면 묻기가 끝나 공지 없이 지나간다
  const loading = isPending || isFetching;

  return {
    popup: loading ? null : unseenPopup(data, doneIds),
    loading,
  };
};
