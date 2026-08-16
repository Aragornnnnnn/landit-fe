// 편지 한 통을 펼쳤을 때의 응답 타입 — 백엔드 계약을 그대로 미러한다.
// 받은 편지와 보낸 피드백은 서버에서 다른 리소스라 응답도 따로다
import type { FeedbackStatus, FeedbackType, MailboxLetterType } from './letter';

// 운영이 쓴 본문. 마크다운 파서를 들이는 대신 블록 배열로 받는다 (피그마 SPEC 권고).
// 렌더러가 타입별 단순 분기라 문법 모호성(줄바꿈·중첩 리스트)을 안고 갈 일이 없다
export type LetterBlock =
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'IMAGE'; url: string; caption?: string }
  | { type: 'ORDERED_LIST'; items: string[] };

// 받은 편지 한 통. 공지·업데이트는 contentBlocks가, 답장은 bodyText가 채워진다
export interface ReceivedLetterDetail {
  letterId: number;
  letterType: MailboxLetterType;
  title: string;
  contentBlocks: LetterBlock[] | null;
  bodyText: string | null;
  pinned: boolean;
  sentAt: string;
  // 조회하면 서버가 읽음으로 찍는다 — 따로 알릴 API가 없다
  readAt: string | null;
  // 답장일 때 내가 골랐던 유형과 그때 쓴 원문.
  // 아직 계약에 없어 백엔드에 요청해 둔 값이라, 없으면 화면이 그 자리를 비운다
  feedbackType?: FeedbackType | null;
  quotedFeedbackContent?: string | null;
}

// 내 피드백에 온 회신 한 통
export interface FeedbackReply {
  letterId: number;
  title: string;
  bodyText: string;
  sentAt: string;
}

// 내가 보낸 피드백 한 통. 답장이 도착했으면 replies가 채워진다
export interface SentFeedbackDetail {
  feedbackId: number;
  type: FeedbackType;
  // 서버가 붙여 주는 유형 이름 — 화면 제목은 우리 문구를 쓰므로 읽지 않는다
  title: string;
  content: string;
  status: FeedbackStatus;
  // 여러 피드백을 묶어 답장했을 때의 대표 피드백. 우리가 쓰지는 않는다
  resolvedByFeedbackId: number | null;
  createdAt: string;
  updatedAt: string;
  replies: FeedbackReply[];
}
