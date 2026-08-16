// 편지를 펼쳤을 때 맨 위에 오는 제목과 칩 — 종류마다 제목이 어디서 오는지가 달라 여기서 하나로 맞춘다
import type { FeedbackStatus, MailboxLetterType } from '../api/letter';
import type {
  ReceivedLetterDetail,
  SentFeedbackDetail,
} from '../api/letter-detail';
import { FEEDBACK_TYPE_FACES } from './feedback-type';
import type { LetterBadge } from './letter-row';

export interface LetterHead {
  title: string;
  badge: LetterBadge;
}

const RECEIVED_BADGES: Record<MailboxLetterType, LetterBadge> = {
  NOTICE: { label: '공지', tone: 'notice' },
  UPDATE: { label: '업데이트', tone: 'update' },
  REPLY: { label: '답장', tone: 'reply' },
};

// 목록에선 '처리완료'라고 적지만 펼친 자리에선 '답장 도착'이다 —
// 목록은 처리 단계를 훑는 자리고, 여기는 그 답장을 읽는 자리라 시안이 문구를 달리 뒀다
const FEEDBACK_BADGES: Record<FeedbackStatus, LetterBadge> = {
  PENDING: { label: '처리중', tone: 'pending' },
  COMPLETED: { label: '답장 도착', tone: 'completed' },
};

// 답장의 제목은 내가 골랐던 유형이다 (시안: "문제 신고하기").
// 그 유형이 아직 응답에 없어서, 없으면 운영이 붙인 편지 제목으로 물러선다
export const toReceivedHead = (letter: ReceivedLetterDetail): LetterHead => ({
  title:
    letter.letterType === 'REPLY' && letter.feedbackType
      ? FEEDBACK_TYPE_FACES[letter.feedbackType].label
      : letter.title,
  badge: RECEIVED_BADGES[letter.letterType],
});

export const toSentHead = (feedback: SentFeedbackDetail): LetterHead => ({
  title: FEEDBACK_TYPE_FACES[feedback.type].label,
  badge: FEEDBACK_BADGES[feedback.status],
});
