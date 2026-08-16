// 편지함 API — 응답 타입은 백엔드 계약을 그대로 미러하고, 호출은 그 아래에 둔다.
// 받은 편지와 보낸 피드백은 서버에서 아예 다른 리소스다 (/mailbox/received, /mailbox/sent).
// 리스트에서 한 줄로 같아 보이는 건 화면 사정이라, 합치는 일은 model/letter-row가 한다
import { api } from '@/shared/api/client';

/** 운영이 보내는 편지의 종류. 공지·업데이트는 모두에게, 답장(REPLY)은 내 피드백에 온 회신이다 */
export type MailboxLetterType = 'NOTICE' | 'UPDATE' | 'REPLY';

/** 내가 보낸 피드백의 유형 — 작성 화면에서 고르는 네 가지. 서버 enum 그대로다 */
export type FeedbackType =
  'BUG_REPORT' | 'FEATURE_REQUEST' | 'QUESTION' | 'CHEER';

/** 내가 보낸 피드백의 처리 상태. COMPLETED면 답장이 달렸다 */
export type FeedbackStatus = 'PENDING' | 'COMPLETED';

/** 목록 응답의 한 장. 커서로 넘기며, 다음 장이 없으면 nextCursor가 null이다 */
export interface MailboxPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

/** 받은 편지 목록의 한 줄 (`GET /mailbox/received`) */
export interface ReceivedLetter {
  letterId: number;
  letterType: MailboxLetterType;
  title: string;
  /** 한 줄로 접어 보여줄 발췌. 길이는 백엔드가 정하고 넘치면 화면이 말줄임한다 */
  preview: string;
  /** 상단 고정 — 서버가 이미 정렬해서 내려주므로 화면은 표시에만 쓴다 */
  pinned: boolean;
  sentAt: string;
  unread: boolean;
}

/** 보낸 피드백 목록의 한 줄 (`GET /mailbox/sent`) */
export interface SentFeedback {
  feedbackId: number;
  type: FeedbackType;
  /** 서버가 붙여 주는 유형 이름("버그 제보"). 목록 제목은 우리 문구를 쓰므로 화면에선 안 읽는다 */
  title: string;
  preview: string;
  status: FeedbackStatus;
  createdAt: string;
}

/**
 * 받은 편지 한 통 (`GET /mailbox/received/{letterId}`).
 * 공지·업데이트는 contentBlocks가, 답장은 bodyText가 채워진다
 */
export interface ReceivedLetterDetail {
  letterId: number;
  letterType: MailboxLetterType;
  title: string;
  /** 서버는 JsonNode — 관리자가 넣은 JSON 그대로다. 아는 모양으로 거르는 일은 model/letter-blocks가 한다 */
  contentBlocks: unknown;
  bodyText: string | null;
  pinned: boolean;
  sentAt: string;
  /** 조회하면 서버가 읽음으로 찍는다 — 따로 알릴 API가 없다 */
  readAt: string | null;
  /** 답장일 때만 — 내가 골랐던 유형. 묶음 답장이면 대표 피드백 하나. 공지·업데이트는 null */
  feedbackType: FeedbackType | null;
  /** 답장일 때만 — 그때 내가 쓴 원문. 공지·업데이트는 null */
  quotedFeedbackContent: string | null;
}

/** 내 피드백에 온 회신 한 통 */
export interface FeedbackReply {
  letterId: number;
  title: string;
  bodyText: string;
  sentAt: string;
}

/**
 * 내가 보낸 피드백 한 통 (`GET /mailbox/sent/{feedbackId}`).
 * 답장이 도착했으면 replies가 채워진다
 */
export interface SentFeedbackDetail {
  feedbackId: number;
  type: FeedbackType;
  /** 서버가 붙여 주는 유형 이름 — 화면 제목은 우리 문구를 쓰므로 읽지 않는다 */
  title: string;
  content: string;
  status: FeedbackStatus;
  /** 여러 피드백을 묶어 답장했을 때의 대표 피드백. 우리가 쓰지는 않는다 */
  resolvedByFeedbackId: number | null;
  createdAt: string;
  updatedAt: string;
  replies: FeedbackReply[];
}

/** 피드백 등록 요청 (`POST /mailbox/feedbacks`) */
export interface FeedbackSubmitRequest {
  type: FeedbackType;
  content: string;
}

/** 한 장에 받는 줄 수. 서버 기본값과 같지만, 화면이 몇 줄을 기대하는지 코드에서 보이게 둔다 */
export const LETTERS_PAGE_SIZE = 20;

// 첫 장은 커서 없이, 다음 장은 앞 장이 준 nextCursor를 실어 부른다
const pageQuery = (cursor: string | null) => {
  const query = new URLSearchParams({ size: String(LETTERS_PAGE_SIZE) });
  if (cursor) query.set('cursor', cursor);
  return `?${query.toString()}`;
};

/** 받은 편지 목록 한 장. 첫 장은 cursor 없이 부른다 */
export const getReceivedLetters = (cursor: string | null = null) =>
  api.get<MailboxPage<ReceivedLetter>>(
    `/api/v1/mailbox/received${pageQuery(cursor)}`,
  );

/** 보낸 피드백 목록 한 장. 첫 장은 cursor 없이 부른다 */
export const getSentFeedbacks = (cursor: string | null = null) =>
  api.get<MailboxPage<SentFeedback>>(
    `/api/v1/mailbox/sent${pageQuery(cursor)}`,
  );

/** 받은 편지 한 통. 조회가 읽음 처리를 겸한다 — 따로 알릴 API가 없다 */
export const getReceivedLetterDetail = (letterId: number) =>
  api.get<ReceivedLetterDetail>(`/api/v1/mailbox/received/${letterId}`);

/** 보낸 피드백 한 통 */
export const getSentFeedbackDetail = (feedbackId: number) =>
  api.get<SentFeedbackDetail>(`/api/v1/mailbox/sent/${feedbackId}`);

/** 안 읽은 편지 개수 — 헤더의 점을 켤지 정한다. 목록 전체를 받아 세는 대신 개수만 묻는다 */
export const getUnreadCount = () =>
  api.get<{ unreadCount: number }>('/api/v1/mailbox/unread-count');

/** 피드백 등록. 201에 본문이 없다 — 보낸 뒤 보낸 편지함을 다시 부르면 새 편지가 따라온다 */
export const submitFeedback = (body: FeedbackSubmitRequest) =>
  api.post<void>('/api/v1/mailbox/feedbacks', body);
