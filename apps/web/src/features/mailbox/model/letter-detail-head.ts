// 편지를 펼쳤을 때 맨 위에 오는 것 — 제목·칩·시각. 종류마다 어디서 오는지가 달라 여기서 하나로 맞춘다
import type { ReceivedLetterDetail, SentFeedbackDetail } from '../api/mailbox';
import { FEEDBACK_TYPE_FACES } from './feedback-type';
import {
  RECEIVED_BADGES,
  SENT_DETAIL_BADGES,
  type LetterBadge,
} from './letter-badge';

export interface LetterHead {
  title: string;
  badge: LetterBadge;
  sentAt: string;
}

// 답장의 제목은 내가 골랐던 유형이다 (시안: "문제 신고하기").
// 계약상 답장엔 유형이 실려 오지만, 비어 오면 운영이 붙인 편지 제목으로 물러선다
export const toReceivedHead = (letter: ReceivedLetterDetail): LetterHead => ({
  title:
    letter.letterType === 'REPLY' && letter.feedbackType
      ? FEEDBACK_TYPE_FACES[letter.feedbackType].label
      : letter.title,
  badge: RECEIVED_BADGES[letter.letterType],
  sentAt: letter.sentAt,
});

// 보낸 피드백의 시각은 내가 쓴 시각이다
export const toSentHead = (feedback: SentFeedbackDetail): LetterHead => ({
  title: FEEDBACK_TYPE_FACES[feedback.type].label,
  badge: SENT_DETAIL_BADGES[feedback.status],
  sentAt: feedback.createdAt,
});
