// 편지함 조회 — 받은 편지와 보낸 피드백은 서버에서 다른 리소스라 주소도 갈린다.
// 목록은 커서로 넘긴다. 첫 장은 커서 없이, 다음 장은 앞 장이 준 nextCursor를 실어 부른다
import { api } from '@/shared/api/client';

import type { MailboxPage, ReceivedLetter, SentFeedback } from './letter';
import type { ReceivedLetterDetail, SentFeedbackDetail } from './letter-detail';

// 서버 기본값과 같다. 명시해 두는 건 화면이 한 장에 몇 줄 기대하는지 코드에서 보이게 하려는 것
export const LETTERS_PAGE_SIZE = 20;

const pageQuery = (cursor: string | null) => {
  const query = new URLSearchParams({ size: String(LETTERS_PAGE_SIZE) });
  if (cursor) query.set('cursor', cursor);
  return `?${query.toString()}`;
};

export const getReceivedLetters = (cursor: string | null = null) =>
  api.get<MailboxPage<ReceivedLetter>>(
    `/api/v1/mailbox/received${pageQuery(cursor)}`,
  );

export const getSentFeedbacks = (cursor: string | null = null) =>
  api.get<MailboxPage<SentFeedback>>(
    `/api/v1/mailbox/sent${pageQuery(cursor)}`,
  );

// 조회가 읽음 처리를 겸한다 — 따로 알릴 API가 없다
export const getReceivedLetterDetail = (letterId: number) =>
  api.get<ReceivedLetterDetail>(`/api/v1/mailbox/received/${letterId}`);

export const getSentFeedbackDetail = (feedbackId: number) =>
  api.get<SentFeedbackDetail>(`/api/v1/mailbox/sent/${feedbackId}`);

// 헤더의 미읽음 점 — 목록 전체를 받아 세는 대신 개수만 묻는다
export const getUnreadCount = async () =>
  (await api.get<{ unreadCount: number }>('/api/v1/mailbox/unread-count'))
    .unreadCount;
