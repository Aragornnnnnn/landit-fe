// 프리미엄 프리뷰 단계와 다음 화면 — 저장된 마지막 단계로 지금 보여 줄 화면을 정한다

// 마지막으로 끝낸 단계. 시작 전은 null
export const TOUR_STEPS = [
  // 피드백을 마치고 홈으로 왔다 — 신규는 레벨 결과 뒤, 기존은 오늘의 시나리오 총평 뒤
  'STARTED',
  'TUTORIAL_DONE',
  'CARD_FLIPPED',
  // 비춘 무료 표현을 열었다 — 끝까지 안 하고 나와도 다시 비추지 않는다. 그 표현을 마치면 그때 페이월로 간다
  'FREE_OPENED',
  // 무료 표현을 마치고 페이월로 갔거나, 프리뷰를 넘겼다 — 다시 뜨지 않는다
  'COMPLETED',
] as const;
export type PreviewStep = (typeof TOUR_STEPS)[number];

// 프리뷰가 지금 보여 줄 화면. 전부 홈에서
export type PreviewScreen =
  'none' | 'tutorial' | 'flip_card' | 'free_expression';

/** 마지막으로 끝낸 단계의 다음 화면 */
export const previewScreenOf = (step: PreviewStep | null): PreviewScreen => {
  switch (step) {
    case 'STARTED':
      return 'tutorial';
    case 'TUTORIAL_DONE':
      return 'flip_card';
    case 'CARD_FLIPPED':
      return 'free_expression';
    default:
      return 'none';
  }
};

/** 무료 표현을 마치면 프리뷰를 끝내고 페이월로 보낼 단계인가 — 무료 표현 차례이거나, 열어 둔 채 나왔다 */
export const awaitsFreeExpressionFinish = (step: PreviewStep | null) =>
  step === 'CARD_FLIPPED' || step === 'FREE_OPENED';
