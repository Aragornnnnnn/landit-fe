// 해지 사유 ① 라디오와 "다른 방법" 라디오의 항목 — 순서·이모지·문구는 피그마 확정 플로우(정리 섹션 2373:329) 그대로
import type { CancelReason, StudyMethod } from '@landit/analytics';

export interface ChoiceOption<Id extends string> {
  id: Id;
  emoji: string;
  label: string;
}

/** ① 사유 7개 — 손쓸 수 있는 것부터, 기타는 맨 아래 */
export const CANCEL_REASONS: readonly ChoiceOption<CancelReason>[] = [
  { id: 'price', emoji: '💸', label: '가격이 부담돼요' },
  { id: 'time', emoji: '⏰', label: '쓸 시간이 없어요' },
  { id: 'progress', emoji: '📈', label: '실력이 느는 것 같지 않아요' },
  { id: 'content', emoji: '🗂️', label: '원하는 콘텐츠가 부족해요' },
  { id: 'bug', emoji: '🐞', label: '앱이 불편하거나 오류가 있어요' },
  { id: 'other_method', emoji: '📱', label: '다른 방법으로 공부하려고요' },
  { id: 'other', emoji: '✍️', label: '기타' },
];

/** "다른 방법" 라디오 4개 */
export const STUDY_METHODS: readonly ChoiceOption<StudyMethod>[] = [
  { id: 'academy', emoji: '🎓', label: '학원 · 과외' },
  { id: 'other_app', emoji: '📱', label: '다른 앱' },
  { id: 'youtube', emoji: '📺', label: '유튜브 · 독학' },
  { id: 'abroad', emoji: '✈️', label: '어학연수 · 해외' },
];

/** 기타 입력 글자 수 상한 — 설문의 기타 입력과 같다 */
export const OTHER_TEXT_MAX_LENGTH = 100;
