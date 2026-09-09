// 피드백을 다 본 뒤 어디로 가는가 — 재대화는 홈, 유료(또는 잠글 수 없는 환경)는 표현 분기,
// 무료 사용자는 페이월 전에 레벨 분석 → 결과 → 학습 준비를 거친다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
export type PostFeedbackView = 'home' | 'branch' | 'analyzing';

/** 피드백을 마친 사람이 다음에 볼 화면을 정한다 */
export const decidePostFeedbackView = ({
  wasCompleted,
  locked,
}: {
  /** 들어올 때 이미 완료했던 시나리오(재대화) */
  wasCompleted: boolean;
  /** 이 대화가 끝나면 게이트가 잠그는가 */
  locked: boolean;
}): PostFeedbackView => {
  if (wasCompleted) return 'home';
  return locked ? 'analyzing' : 'branch';
};
