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
  const { data, isPending } = useActivePopupQuery();

  return {
    popup: unseenPopup(data, doneIds),
    // 응답을 기다리는 동안엔 공지가 뜰지 모른다 — 그동안 램프·소감이 먼저 나서지 않게 붙잡는다.
    // 실패(배포 전 404 포함)하면 isPending이 풀려 공지 없이 지나간다
    loading: isPending,
  };
};
