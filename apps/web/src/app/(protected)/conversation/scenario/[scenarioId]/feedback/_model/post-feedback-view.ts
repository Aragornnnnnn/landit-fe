// 피드백을 다 본 뒤 어디로 가는가 — 재대화는 홈, 잠기지 않는 사람은 표현 분기,
// 무료 사용자는 첫 시나리오에서만 레벨 분석 → 결과 → 학습 준비를 거치고 그 뒤로는 홈이다 (docs/subscription.md 「무료 구간과 페이월 게이트」)
export type PostFeedbackView = 'home' | 'branch' | 'analyzing';

/** 피드백을 마친 사람이 다음에 볼 화면을 정한다 */
export const decidePostFeedbackView = ({
  replay,
  learningLocked,
  detailFeedbackLocked,
}: {
  /** 들어올 때 이미 완료했던 시나리오(재대화) */
  replay: boolean;
  /** 이 사람에게 학습 문(표현 학습·스몰톡)이 잠기는가 — 잠글 수 있는 환경의 무료 사용자 */
  learningLocked: boolean;
  /** 서버가 이 세션의 상세 피드백을 잠갔는가. 무료 사용자에게 열려 있으면 그게 첫 시나리오의 첫 완료다 */
  detailFeedbackLocked: boolean;
}): PostFeedbackView => {
  if (replay) return 'home';
  if (!learningLocked) return 'branch';
  // 첫 시나리오 — 상세까지 다 보여준 뒤 레벨을 매기고 학습을 소개한 자리에서 페이월을 만난다
  if (!detailFeedbackLocked) return 'analyzing';
  // 두 번째부터 — 총평이 끝이다. 상세는 CTA에서 이미 페이월로 안내했으니 여기선 홈으로
  return 'home';
};
