// 해지 사유 ① 라디오와 "다른 방법" 라디오의 항목 — 순서·이모지·문구는 피그마 확정 플로우(정리 섹션 2373:329) 그대로
import type { CancelReason, StudyMethod } from '@landit/analytics';
import type { Messages } from 'next-intl';

export interface ChoiceOption<Id extends string, LabelKey extends string> {
  id: Id;
  emoji: string;
  /** 문구 키 — subscription.cancelReasons·studyMethods 아래 */
  labelKey: LabelKey;
}

type CancelReasonLabelKey = keyof Messages['subscription']['cancelReasons'];
type StudyMethodLabelKey = keyof Messages['subscription']['studyMethods'];

/** ① 사유 7개 — 손쓸 수 있는 것부터, 기타는 맨 아래 */
export const CANCEL_REASONS: readonly ChoiceOption<
  CancelReason,
  CancelReasonLabelKey
>[] = [
  { id: 'price', emoji: '💸', labelKey: 'priceLabel' },
  { id: 'time', emoji: '⏰', labelKey: 'timeLabel' },
  { id: 'progress', emoji: '📈', labelKey: 'progressLabel' },
  { id: 'content', emoji: '🗂️', labelKey: 'contentLabel' },
  { id: 'bug', emoji: '🐞', labelKey: 'bugLabel' },
  { id: 'other_method', emoji: '📱', labelKey: 'otherMethodLabel' },
  { id: 'other', emoji: '✍️', labelKey: 'otherLabel' },
];

/** "다른 방법" 라디오 4개 */
export const STUDY_METHODS: readonly ChoiceOption<
  StudyMethod,
  StudyMethodLabelKey
>[] = [
  { id: 'academy', emoji: '🎓', labelKey: 'academyLabel' },
  { id: 'other_app', emoji: '📱', labelKey: 'otherAppLabel' },
  { id: 'youtube', emoji: '📺', labelKey: 'youtubeLabel' },
  { id: 'abroad', emoji: '✈️', labelKey: 'abroadLabel' },
];

/** 기타 입력 글자 수 상한 */
export const OTHER_TEXT_MAX_LENGTH = 100;
