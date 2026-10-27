// 편지를 펼쳤을 때 맨 위에 오는 것 — 제목·칩·시각. 종류마다 어디서 오는지가 달라 여기서 하나로 맞춘다
import type { Translator } from '@/shared/i18n/translator';

import type { ReceivedLetterDetail, SentFeedbackDetail } from '../api/mailbox';
import { FEEDBACK_TYPE_FACES } from './feedback-type';
import {
  SENT_DETAIL_BADGES,
  toReceivedBadge,
  translateBadge,
  type LetterBadge,
} from './letter-badge';

export interface LetterHead {
  title: string;
  badge: LetterBadge;
  sentAt: string;
}

// 답장의 제목은 내가 골랐던 유형이다 (시안: "문제 신고하기").
// 계약상 답장엔 유형이 실려 오지만, 비어 오면 운영이 붙인 편지 제목으로 물러선다
export const toReceivedHead = (
  letter: ReceivedLetterDetail,
  t: Translator<'mailbox'>,
): LetterHead => ({
  title:
    letter.letterType === 'REPLY' && letter.feedbackType
      ? t(`feedbackType.${FEEDBACK_TYPE_FACES[letter.feedbackType].labelKey}`)
      : letter.title,
  badge: translateBadge(toReceivedBadge(letter.letterType), t),
  sentAt: letter.sentAt,
});

// 보낸 피드백의 시각은 내가 쓴 시각이다
export const toSentHead = (
  feedback: SentFeedbackDetail,
  t: Translator<'mailbox'>,
): LetterHead => ({
  title: t(`feedbackType.${FEEDBACK_TYPE_FACES[feedback.type].labelKey}`),
  badge: translateBadge(SENT_DETAIL_BADGES[feedback.status], t),
  sentAt: feedback.createdAt,
});
