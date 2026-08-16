// 편지함 응답 타입 — 백엔드 계약을 그대로 미러한다.
// 받은 편지와 보낸 피드백은 서버에서 아예 다른 리소스다 (/mailbox/received, /mailbox/sent).
// 리스트에서 한 줄로 같아 보이는 건 화면 사정이라, 합치는 일은 model/letter-row가 한다

// 운영이 보내는 편지의 종류. 공지·업데이트는 모두에게, 답장은 내 피드백에 온 회신이다
export type MailboxLetterType = 'NOTICE' | 'UPDATE' | 'REPLY';

// 내가 보낸 피드백의 유형 — 작성 화면에서 고르는 네 가지
export type FeedbackType =
  'BUG_REPORT' | 'FEATURE_REQUEST' | 'QUESTION' | 'CHEER';

// 내가 보낸 피드백의 처리 상태
export type FeedbackStatus = 'PENDING' | 'COMPLETED';

// 목록은 커서로 넘긴다 — 다음 장이 없으면 nextCursor가 null이다
export interface MailboxPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface ReceivedLetter {
  letterId: number;
  letterType: MailboxLetterType;
  title: string;
  // 리스트에 한 줄로 접어 보여줄 발췌. 길이는 백엔드가 정하고 넘치면 화면이 말줄임한다
  preview: string;
  // 상단 고정 — 서버가 이미 정렬해서 내려주므로 화면은 표시에만 쓴다
  pinned: boolean;
  sentAt: string;
  unread: boolean;
}

export interface SentFeedback {
  feedbackId: number;
  type: FeedbackType;
  // 서버가 붙여 주는 유형 이름("버그 제보"). 목록 제목은 우리 문구를 쓰므로 화면에선 안 읽는다
  title: string;
  preview: string;
  status: FeedbackStatus;
  createdAt: string;
}
