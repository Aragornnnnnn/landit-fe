// 편지 한 줄의 내용 — 받은 편지와 보낸 피드백이 리스트에선 같은 모양이라 여기서 하나로 맞춘다.
// 화면이 두 갈래를 따로 알 필요가 없게, 다른 점(제목·칩·미읽음·주소)을 이 변환이 흡수한다
import type { ReceivedLetter, SentFeedback } from '../api/mailbox';
import { receivedLetterPath, sentFeedbackPath } from './box';
import { FEEDBACK_TYPE_FACES } from './feedback-type';
import {
  RECEIVED_BADGES,
  SENT_ROW_BADGES,
  type LetterBadge,
} from './letter-badge';

export interface LetterRow {
  // 받은 편지와 보낸 피드백은 아이디 공간이 다르다 — 목록은 키로만 쓰고, 어디로 갈지는 href가 안다
  id: number;
  href: string;
  badge: LetterBadge;
  title: string;
  preview: string;
  sentAt: string;
  unread: boolean;
}

export const toReceivedRow = (letter: ReceivedLetter): LetterRow => ({
  id: letter.letterId,
  href: receivedLetterPath(letter.letterId),
  badge: RECEIVED_BADGES[letter.letterType],
  title: letter.title,
  preview: letter.preview,
  sentAt: letter.sentAt,
  unread: letter.unread,
});

export const toSentRow = (feedback: SentFeedback): LetterRow => ({
  id: feedback.feedbackId,
  href: sentFeedbackPath(feedback.feedbackId),
  badge: SENT_ROW_BADGES[feedback.status],
  // 제목은 고른 유형의 이름이다 — 내가 쓴 원문은 미리보기 자리로 간다.
  // 서버도 유형 이름(title)을 내려주지만 화면 문구는 우리가 정한다 ("문제 신고하기" vs "버그 제보")
  title: FEEDBACK_TYPE_FACES[feedback.type].label,
  preview: feedback.preview,
  sentAt: feedback.createdAt,
  // 내가 보낸 편지를 내가 안 읽었을 리 없다
  unread: false,
});
