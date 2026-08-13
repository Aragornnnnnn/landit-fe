// 편지 한 통을 펼쳤을 때의 응답 타입 — 백엔드가 아직 없어 FE가 먼저 쓴 계약 초안이다 (LAN-218)
import type { FeedbackStatus, FeedbackType } from './letter';

// 공지·업데이트 본문. 마크다운 파서를 들이는 대신 블록 배열로 받는다 (피그마 SPEC 권고).
// 렌더러가 타입별 단순 분기라 문법 모호성(줄바꿈·중첩 리스트)을 안고 갈 일이 없다
export type LetterBlock =
  | { type: 'PARAGRAPH'; text: string }
  | { type: 'IMAGE'; url: string; caption?: string }
  | { type: 'ORDERED_LIST'; items: string[] };

// 운영이 모두에게 보낸 편지 — 제목과 본문을 직접 쓴다.
// kind는 갈래마다 하나씩 박는다. 한 멤버에 'NOTICE' | 'UPDATE'로 묶으면 좁히기가 안 먹는다
interface BroadcastBody {
  letterId: number;
  title: string;
  sentAt: string;
  blocks: LetterBlock[];
  read: boolean;
}

// 내 피드백에 온 회신. 제목은 내가 골랐던 유형이고, 내가 쓴 원문을 함께 인용해 준다
interface ReplyLetter {
  letterId: number;
  kind: 'REPLY';
  feedbackType: FeedbackType;
  sentAt: string;
  replyText: string;
  quotedText: string;
  read: boolean;
}

// 내가 보낸 편지. 답장이 도착했으면 reply가 채워진다
interface FeedbackLetter {
  letterId: number;
  kind: 'FEEDBACK';
  feedbackType: FeedbackType;
  status: FeedbackStatus;
  sentAt: string;
  content: string;
  reply: { text: string; sentAt: string } | null;
}

export type LetterDetail =
  | (BroadcastBody & { kind: 'NOTICE' })
  | (BroadcastBody & { kind: 'UPDATE' })
  | ReplyLetter
  | FeedbackLetter;
