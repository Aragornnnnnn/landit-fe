'use client';

// 이벤트 공지 게이트 — 띄운 공지에 한 번 반응하면(자세히 보기든 닫기든) 이 기기에서 다시 띄우지 않는다.
// 띄울지·어떤 공지인지·지금 열려 있는지는 부르는 쪽(홈 탭)이 정한다 — 닫힌 뒤 다시 붙어도 열리지 않게
import { useEffect } from 'react';
import { EVENTS } from '@landit/analytics';
import { useRouter } from 'next/navigation';

import { track } from '@/shared/analytics';

import type { ActivePopup } from '../api/event-popup';
import { markEventPopupDone, popupLinkTarget } from '../model/active-popup';
import { EventPopupSheet } from './EventPopupSheet';

export const EventPopupGate = ({
  popup,
  open,
  onClose,
}: {
  popup: ActivePopup;
  open: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();
  const target = popupLinkTarget(popup.linkUrl);

  useEffect(() => {
    if (open) track(EVENTS.EVENT_POPUP_VIEWED, { popup_id: popup.popupId });
  }, [open, popup.popupId]);

  const close = () => {
    markEventPopupDone(popup.popupId);
    onClose();
  };

  const openDetail = () => {
    if (!target) return;
    track(EVENTS.EVENT_POPUP_TAPPED, { popup_id: popup.popupId });
    close();
    // 바깥 주소는 셸이 웹뷰 밖(OS 브라우저)으로 넘긴다 — 편지 본문 링크와 같은 길이다
    if (target.kind === 'external') window.location.assign(target.url);
    else router.push(target.path);
  };

  const dismiss = () => {
    track(EVENTS.EVENT_POPUP_DISMISSED, { popup_id: popup.popupId });
    close();
  };

  return (
    <EventPopupSheet
      open={open}
      imageUrl={popup.imageUrl}
      onOpenDetail={target ? openDetail : undefined}
      onClose={dismiss}
    />
  );
};
