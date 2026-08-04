// 완료 카드가 보여줄 표현 학습 진행 단계 — 남은 개수가 다음 행동을 정한다
export type ExpressionStage =
  // 배정된 표현이 없다 — 게이지도 버튼도 그리지 않는다
  | 'unavailable'
  // 아직 하나도 안 배웠다
  | 'none'
  // 배우다 말았다
  | 'partial'
  // 다 배웠다 — 남은 건 복습뿐이다
  | 'done';

export const expressionStageOf = (
  completed: number,
  total: number,
): ExpressionStage => {
  if (total <= 0) return 'unavailable';
  if (completed <= 0) return 'none';
  // 표현이 줄어 완료 수가 전체를 넘어도 게이지가 넘치지 않게 완료로 본다
  if (completed >= total) return 'done';
  return 'partial';
};
