// 해지 사유 플로우의 스텝 규칙 — ① 사유 → ② 사유별 화면. "다른 방법"만 방법 라디오를 거쳐 ③으로 간다.
// 화면은 이 함수들이 돌려준 상태만 그린다. 어디로 갈 수 있는지·돌아가면 어디인지는 전부 여기서 정한다
import type { CancelReason, StudyMethod } from '@landit/analytics';

/** ② 화면이 있는 사유 — "다른 방법"은 방법을 물은 뒤 ③으로 가므로 여기 없다 */
export type RetentionReason = Exclude<CancelReason, 'other_method'>;

export type CancelStep =
  | { kind: 'reason' }
  | { kind: 'retention'; reason: RetentionReason }
  | { kind: 'method' }
  | { kind: 'method_retention'; method: StudyMethod };

export interface CancelDraft {
  reason: CancelReason | null;
  otherText: string;
  method: StudyMethod | null;
}

export const EMPTY_DRAFT: CancelDraft = {
  reason: null,
  otherText: '',
  method: null,
};

/** 기타를 골랐으면 적은 글이 있어야 넘어간다. 빈칸·공백만은 안 적은 것이다 */
export const canProceedFromReason = (draft: CancelDraft) => {
  if (draft.reason === null) return false;
  if (draft.reason === 'other') return draft.otherText.trim().length > 0;
  return true;
};

/** ①에서 "다음" — 다른 방법이면 어떤 방법인지부터 묻고, 나머지는 바로 사유별 화면 */
export const stepAfterReason = (reason: CancelReason): CancelStep =>
  reason === 'other_method'
    ? { kind: 'method' }
    : { kind: 'retention', reason };

/** 방법 라디오에서 "다음" */
export const stepAfterMethod = (method: StudyMethod): CancelStep => ({
  kind: 'method_retention',
  method,
});

/** 뒤로가기 — 한 칸 앞 스텝, ①에서는 null(플로우 밖으로) */
export const stepBefore = (step: CancelStep): CancelStep | null => {
  switch (step.kind) {
    case 'reason':
      return null;
    case 'retention':
    case 'method':
      return { kind: 'reason' };
    case 'method_retention':
      return { kind: 'method' };
  }
};

/** 이 스텝이 어느 사유·방법 위에 있나 — 이벤트가 "어디서 남았나·나갔나"를 적을 때 쓴다. ①은 아직 고른 게 없다 */
export const stepContext = (
  step: CancelStep,
): { reason?: CancelReason; method?: StudyMethod } => {
  switch (step.kind) {
    case 'reason':
      return {};
    case 'retention':
      return { reason: step.reason };
    case 'method':
      return { reason: 'other_method' };
    case 'method_retention':
      return { reason: 'other_method', method: step.method };
  }
};
