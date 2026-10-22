// 홈 진입 때 띄울 이벤트 공지를 하나 고른다 — 마운트 때 한 번 고정해, 반응한 기록이 생겨도 이번 방문의 판단은 뒤집히지 않게
import { useState } from 'react';

import {
  isEventPopupDone,
  pickActivePopup,
} from '@/features/event-popup/model/active-popup';
import {
  EVENT_POPUPS,
  type EventPopup,
} from '@/features/event-popup/model/event-popups';

export const useActiveEventPopup = (): EventPopup | null => {
  const [popup] = useState(() =>
    pickActivePopup(EVENT_POPUPS, new Date(), isEventPopupDone),
  );
  return popup;
};
