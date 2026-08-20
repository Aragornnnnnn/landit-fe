// 편지 칩 — 종류·처리 상태를 문구와 색갈래로 옮기는 표. 목록과 상세가 같은 칩을 쓴다
import type { FeedbackStatus, MailboxLetterType } from '../api/mailbox';

// 칩의 색갈래. 색값이 아니라 의미를 넘긴다 — 팔레트는 UI가 정한다
export type LetterBadgeTone =
  'notice' | 'update' | 'reply' | 'pending' | 'completed';

export interface LetterBadge {
  label: string;
  tone: LetterBadgeTone;
}

export const RECEIVED_BADGES: Record<MailboxLetterType, LetterBadge> = {
  NOTICE: { label: '공지', tone: 'notice' },
  UPDATE: { label: '업데이트', tone: 'update' },
  REPLY: { label: '답장', tone: 'reply' },
};

// 보낸 피드백은 자리마다 문구가 다르다 — 목록은 처리 단계를 훑는 자리라 '처리완료',
// 펼친 자리는 그 답장을 읽는 자리라 '답장 도착'. 시안이 그렇게 뒀다
export const SENT_ROW_BADGES: Record<FeedbackStatus, LetterBadge> = {
  PENDING: { label: '처리중', tone: 'pending' },
  COMPLETED: { label: '처리완료', tone: 'completed' },
};

export const SENT_DETAIL_BADGES: Record<FeedbackStatus, LetterBadge> = {
  PENDING: { label: '처리중', tone: 'pending' },
  COMPLETED: { label: '답장 도착', tone: 'completed' },
};
