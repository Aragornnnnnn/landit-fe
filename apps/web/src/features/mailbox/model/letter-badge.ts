// 편지 칩 — 종류·처리 상태를 문구 키와 색갈래로 옮기는 표. 목록과 상세가 같은 칩을 쓴다
import type { Translator } from '@/shared/i18n/translator';

import type { FeedbackStatus, MailboxLetterType } from '../api/mailbox';

// 칩의 색갈래. 색값이 아니라 의미를 넘긴다 — 팔레트는 UI가 정한다
export type LetterBadgeTone =
  'notice' | 'update' | 'reply' | 'direct' | 'pending' | 'completed';

// 칩 문구 키 — mailbox.letterBadge 아래
export type LetterBadgeLabelKey =
  | 'noticeBadge'
  | 'updateBadge'
  | 'replyBadge'
  | 'directBadge'
  | 'pendingBadge'
  | 'completedBadge'
  | 'answeredBadge';

export interface LetterBadgeFace {
  labelKey: LetterBadgeLabelKey;
  tone: LetterBadgeTone;
}

// 화면 언어로 옮긴 칩 — 목록 줄과 상세 머리가 그대로 그린다
export interface LetterBadge {
  label: string;
  tone: LetterBadgeTone;
}

// 밖에서는 toReceivedBadge로만 읽는다 — 표를 바로 읽으면 모르는 종류에서 칩이 비어 화면이 깨진다
const RECEIVED_BADGES: Record<MailboxLetterType, LetterBadgeFace> = {
  NOTICE: { labelKey: 'noticeBadge', tone: 'notice' },
  UPDATE: { labelKey: 'updateBadge', tone: 'update' },
  REPLY: { labelKey: 'replyBadge', tone: 'reply' },
  DIRECT: { labelKey: 'directBadge', tone: 'direct' },
};

// 서버가 웹보다 먼저 새 종류를 보내도 편지함 전체가 깨지지 않게 「편지」 칩으로 물러선다.
// 받는 사람에게 「편지」 칩이 두 모양으로 보이지 않게 개인 편지 칩을 그대로 쓴다
export const toReceivedBadge = (type: MailboxLetterType): LetterBadgeFace =>
  RECEIVED_BADGES[type] ?? RECEIVED_BADGES.DIRECT;

// 보낸 피드백은 자리마다 문구가 다르다 — 목록은 처리 단계를 훑는 자리라 '처리완료',
// 펼친 자리는 그 답장을 읽는 자리라 '답장 도착'. 시안이 그렇게 뒀다
export const SENT_ROW_BADGES: Record<FeedbackStatus, LetterBadgeFace> = {
  PENDING: { labelKey: 'pendingBadge', tone: 'pending' },
  COMPLETED: { labelKey: 'completedBadge', tone: 'completed' },
};

export const SENT_DETAIL_BADGES: Record<FeedbackStatus, LetterBadgeFace> = {
  PENDING: { labelKey: 'pendingBadge', tone: 'pending' },
  COMPLETED: { labelKey: 'answeredBadge', tone: 'completed' },
};

/** 칩을 화면 언어로 옮긴다 — 줄·머리를 만드는 변환이 서버 제목과 함께 문구를 채울 때 쓴다 */
export const translateBadge = (
  { labelKey, tone }: LetterBadgeFace,
  t: Translator<'mailbox'>,
): LetterBadge => ({ label: t(`letterBadge.${labelKey}`), tone });
