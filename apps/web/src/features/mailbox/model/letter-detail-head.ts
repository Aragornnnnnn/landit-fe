// 편지를 펼쳤을 때 맨 위에 오는 제목과 칩 — 종류마다 제목이 어디서 오는지가 달라 여기서 하나로 맞춘다
import type { FeedbackStatus } from '../api/letter';
import type { LetterDetail } from '../api/letter-detail';
import { FEEDBACK_TYPE_FACES } from './feedback-type';
import type { LetterBadge } from './letter-row';

export interface LetterHead {
  title: string;
  badge: LetterBadge;
}

const BROADCAST_BADGES: Record<'NOTICE' | 'UPDATE', LetterBadge> = {
  NOTICE: { label: '공지', tone: 'notice' },
  UPDATE: { label: '업데이트', tone: 'update' },
};

// 목록에선 '처리완료'라고 적지만 펼친 자리에선 '답장 도착'이다 —
// 목록은 처리 단계를 훑는 자리고, 여기는 그 답장을 읽는 자리라 시안이 문구를 달리 뒀다
const FEEDBACK_BADGES: Record<FeedbackStatus, LetterBadge> = {
  PENDING: { label: '처리중', tone: 'pending' },
  ANSWERED: { label: '답장 도착', tone: 'answered' },
};

export const toLetterHead = (letter: LetterDetail): LetterHead => {
  if (letter.kind === 'NOTICE' || letter.kind === 'UPDATE') {
    return { title: letter.title, badge: BROADCAST_BADGES[letter.kind] };
  }

  // 답장과 보낸 편지는 둘 다 내가 골랐던 유형이 제목이 된다
  const title = FEEDBACK_TYPE_FACES[letter.feedbackType].label;

  if (letter.kind === 'REPLY') {
    return { title, badge: { label: '답장', tone: 'reply' } };
  }
  return { title, badge: FEEDBACK_BADGES[letter.status] };
};
