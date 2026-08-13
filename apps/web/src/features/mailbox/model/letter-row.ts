// 편지 한 줄의 내용 — 받은 편지와 보낸 편지가 리스트에선 같은 모양이라 여기서 하나로 맞춘다
// 화면이 두 갈래를 따로 알 필요가 없게, 다른 점(제목·칩·미읽음)을 이 변환이 흡수한다
import type {
  FeedbackStatus,
  ReceivedLetter,
  ReceivedLetterKind,
  SentLetter,
} from '../api/letter';
import { FEEDBACK_TYPE_FACES } from './feedback-type';

// 칩의 색갈래. 색값이 아니라 의미를 넘긴다 — 팔레트는 UI가 정한다
export type LetterBadgeTone =
  'notice' | 'update' | 'reply' | 'pending' | 'answered';

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

const RECEIVED_BADGES: Record<ReceivedLetterKind, LetterBadge> = {
  NOTICE: { label: '공지', tone: 'notice' },
  UPDATE: { label: '업데이트', tone: 'update' },
  REPLY: { label: '답장', tone: 'reply' },
};

const SENT_BADGES: Record<FeedbackStatus, LetterBadge> = {
  PENDING: { label: '처리중', tone: 'pending' },
  ANSWERED: { label: '처리완료', tone: 'answered' },
};

export const toReceivedRow = (letter: ReceivedLetter): LetterRow => ({
  letterId: letter.letterId,
  badge: RECEIVED_BADGES[letter.kind],
  title: letter.title,
  preview: letter.preview,
  sentAt: letter.sentAt,
  unread: !letter.read,
});

export const toSentRow = (letter: SentLetter): LetterRow => ({
  letterId: letter.letterId,
  badge: SENT_BADGES[letter.status],
  // 내가 쓴 원문은 제목이 아니라 미리보기 자리로 간다 — 제목은 고른 유형이다
  title: FEEDBACK_TYPE_FACES[letter.feedbackType].label,
  preview: letter.preview,
  sentAt: letter.sentAt,
  // 내가 보낸 편지를 내가 안 읽었을 리 없다
  unread: false,
});
