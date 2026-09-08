// 피드백을 다 본 뒤 어디로 가는가 — 재대화는 홈, 유료(또는 잠글 수 없는 환경)는 표현 분기,
// 무료 사용자는 페이월 전에 학습 준비 화면을, 생애 첫 대화면 그 앞에 레벨 분석까지 거친다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
export type PostFeedbackView = 'home' | 'branch' | 'analyzing' | 'prepared';

export const decidePostFeedbackView = ({
  wasCompleted,
  locked,
  firstEver,
}: {
  // 들어올 때 이미 완료했던 시나리오(재대화)
  wasCompleted: boolean;
  // 이 대화가 끝나면 게이트가 잠그는가
  locked: boolean;
  // 생애 첫 완료인가. 모르면(null) 첫 대화로 치지 않는다 — 분석 화면은 기다림이 있어 잘못 보여주는 쪽이 더 나쁘다
  firstEver: boolean | null;
}): PostFeedbackView => {
  if (wasCompleted) return 'home';
  if (!locked) return 'branch';
  return firstEver === true ? 'analyzing' : 'prepared';
};
