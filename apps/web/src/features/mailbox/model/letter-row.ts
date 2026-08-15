// 편지 한 줄의 내용 — 받은 편지와 보낸 편지가 리스트에선 같은 모양이라 여기서 하나로 맞춘다
// 화면이 두 갈래를 따로 알 필요가 없게, 다른 점(제목·칩·미읽음)을 이 변환이 흡수한다
import type {
  FeedbackStatus,
  MailboxLetterType,
  ReceivedLetter,
  SentFeedback,
} from '../api/mailbox';
import { FEEDBACK_TYPE_FACES } from './feedback-type';

// 칩의 색갈래. 색값이 아니라 의미를 넘긴다 — 팔레트는 UI가 정한다
export type LetterBadgeTone =
  'notice' | 'update' | 'reply' | 'pending' | 'completed';

export interface LetterBadge {
  label: string;
  tone: LetterBadgeTone;
}

export interface LetterRow {
  letterId: number;
  badge: LetterBadge;
  title: string;
  preview: string;
  sentAt: string;
  unread: boolean;
}

// 받은 편지의 칩은 목록과 상세가 같은 표를 쓴다 — 보낸 편지는 자리마다 문구가 달라 각자 둔다
export const RECEIVED_BADGES: Record<MailboxLetterType, LetterBadge> = {
  NOTICE: { label: '공지', tone: 'notice' },
  UPDATE: { label: '업데이트', tone: 'update' },
  REPLY: { label: '답장', tone: 'reply' },
};

const SENT_BADGES: Record<FeedbackStatus, LetterBadge> = {
  PENDING: { label: '처리중', tone: 'pending' },
  COMPLETED: { label: '처리완료', tone: 'completed' },
};

export const toReceivedRow = (letter: ReceivedLetter): LetterRow => ({
  letterId: letter.letterId,
  badge: RECEIVED_BADGES[letter.letterType],
  title: letter.title,
  preview: letter.preview,
  sentAt: letter.sentAt,
  unread: letter.unread,
});

export const toSentRow = (feedback: SentFeedback): LetterRow => ({
  letterId: feedback.feedbackId,
  badge: SENT_BADGES[feedback.status],
  // 제목은 고른 유형의 이름이다 — 내가 쓴 원문은 미리보기 자리로 간다.
  // 서버도 유형 이름(title)을 내려주지만 화면 문구는 우리가 정한다 ("문제 신고하기" vs "버그 제보")
  title: FEEDBACK_TYPE_FACES[feedback.type].label,
  preview: feedback.preview,
  sentAt: feedback.createdAt,
  // 내가 보낸 편지를 내가 안 읽었을 리 없다
  unread: false,
});
