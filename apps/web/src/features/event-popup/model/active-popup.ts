// 이번 방문에 띄울 이벤트 팝업 고르기 — 노출 기간 안이고 이 기기에서 아직 반응하지 않은 것 중 목록 앞의 것 하나
import { readPromptEntry, updatePromptEntry } from '@/shared/lib/prompt-store';

import type { EventPopup } from './event-popups';

const RECORD_KEY = 'event-popup';

interface EventPopupRecord {
  doneIds?: string[];
}

export const pickActivePopup = (
  popups: EventPopup[],
  now: Date,
  isDone: (popupId: string) => boolean,
): EventPopup | null => {
  const time = now.getTime();
  return (
    popups.find(
      (popup) =>
        Date.parse(popup.startAt) <= time &&
        time < Date.parse(popup.endAt) &&
        !isDone(popup.popupId),
    ) ?? null
  );
};

const readDoneIds = () =>
  readPromptEntry<EventPopupRecord>(RECORD_KEY)?.doneIds ?? [];

export const isEventPopupDone = (popupId: string) =>
  readDoneIds().includes(popupId);

/** 닫기든 자세히 보기든, 한 번 반응한 팝업은 이 기기에서 다시 띄우지 않는다 */
export const markEventPopupDone = (popupId: string) => {
  updatePromptEntry<EventPopupRecord>(RECORD_KEY, {
    doneIds: [...readDoneIds(), popupId],
  });
};
