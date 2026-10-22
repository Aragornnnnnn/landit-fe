'use client';

// 이벤트 공지 게이트 — 띄운 공지에 한 번 반응하면(자세히 보기든 닫기든) 이 기기에서 다시 띄우지 않는다.
// 띄울지와 어떤 공지인지는 부르는 쪽(홈 탭의 useActiveEventPopup)이 정한다
import { useEffect, useState } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';

import { markEventPopupDone } from '../model/active-popup';
import type { EventPopup } from '../model/event-popups';
import { EventPopupSheet } from './EventPopupSheet';

export const EventPopupGate = ({ popup }: { popup: EventPopup }) => {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    track(EVENTS.EVENT_POPUP_VIEWED, { popup_id: popup.popupId });
  }, [popup.popupId]);

  const close = () => {
    markEventPopupDone(popup.popupId);
    setOpen(false);
  };

  const openDetail = () => {
    track(EVENTS.EVENT_POPUP_TAPPED, { popup_id: popup.popupId });
    close();
    router.push(popup.linkUrl);
  };

  const dismiss = () => {
    track(EVENTS.EVENT_POPUP_DISMISSED, { popup_id: popup.popupId });
    close();
  };

  return (
    <EventPopupSheet
      open={open}
      popup={popup}
      onOpenDetail={openDetail}
      onClose={dismiss}
    />
  );
};
