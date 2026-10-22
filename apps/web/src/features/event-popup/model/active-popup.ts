// 이벤트 공지 규칙 — 어떤 공지를 띄울지는 서버가 고르고, 여기서는 이 기기에서 이미 반응한 공지를 거르고 링크를 가른다
import { readPromptEntry, updatePromptEntry } from '@/shared/lib/prompt-store';

import type { ActivePopup } from '../api/event-popup';

const RECORD_KEY = 'event-popup';

interface EventPopupRecord {
  doneIds?: number[];
}

export const readEventPopupDoneIds = () =>
  readPromptEntry<EventPopupRecord>(RECORD_KEY)?.doneIds ?? [];

/** 닫기든 자세히 보기든, 한 번 반응한 공지는 이 기기에서 다시 띄우지 않는다 */
export const markEventPopupDone = (popupId: number) => {
  updatePromptEntry<EventPopupRecord>(RECORD_KEY, {
    doneIds: [...readEventPopupDoneIds(), popupId],
  });
};

export const unseenPopup = (
  popup: ActivePopup | null | undefined,
  doneIds: number[],
): ActivePopup | null =>
  popup && !doneIds.includes(popup.popupId) ? popup : null;

export type PopupLinkTarget =
  { kind: 'app'; path: string } | { kind: 'external'; url: string };

/**
 * 앱 안 경로는 화면 이동, https 주소는 바깥 브라우저로 연다.
 * 그 밖의 형식은 서버가 막지만, 잘못 들어와도 웹뷰가 엉뚱한 곳으로 가지 않게 누를 곳을 만들지 않는다
 */
export const popupLinkTarget = (
  linkUrl: string | null,
): PopupLinkTarget | null => {
  if (!linkUrl) return null;
  if (linkUrl.startsWith('/') && !linkUrl.startsWith('//'))
    return { kind: 'app', path: linkUrl };
  if (linkUrl.startsWith('https://')) return { kind: 'external', url: linkUrl };
  return null;
};
