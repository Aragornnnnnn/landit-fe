// 편지 칩 — 종류·처리 상태를 문구와 색갈래로 옮기는 표. 목록과 상세가 같은 칩을 쓴다
import type { FeedbackStatus, MailboxLetterType } from '../api/mailbox';

// 칩의 색갈래. 색값이 아니라 의미를 넘긴다 — 팔레트는 UI가 정한다
export type LetterBadgeTone =
  'notice' | 'update' | 'reply' | 'direct' | 'pending' | 'completed';

export interface LetterBadge {
  label: string;
  tone: LetterBadgeTone;
}

// 밖에서는 toReceivedBadge로만 읽는다 — 표를 바로 읽으면 모르는 종류에서 칩이 비어 화면이 깨진다
const RECEIVED_BADGES: Record<MailboxLetterType, LetterBadge> = {
  NOTICE: { label: '공지', tone: 'notice' },
  UPDATE: { label: '업데이트', tone: 'update' },
  REPLY: { label: '답장', tone: 'reply' },
  DIRECT: { label: '나에게', tone: 'direct' },
};

// 서버가 웹보다 먼저 새 종류를 보내도 편지함 전체가 깨지지 않게 색 없는 칩으로 물러선다
const UNKNOWN_RECEIVED_BADGE: LetterBadge = { label: '편지', tone: 'notice' };

export const toReceivedBadge = (type: MailboxLetterType): LetterBadge =>
  RECEIVED_BADGES[type] ?? UNKNOWN_RECEIVED_BADGE;

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
