// 첫 표현 투어 단계와 다음 화면 — 저장된 마지막 단계로 지금 보여 줄 화면을 정한다

// 마지막으로 끝낸 단계. 시작 전은 null
export const TOUR_STEPS = [
  // 신규 — 첫 시나리오의 레벨 결과까지 봤다
  'LEVEL_SEEN',
  // 기존 — 오늘의 시나리오 총평까지 봤다
  'FEEDBACK_SEEN',
  'CHALLENGE_INTRO_SEEN',
  'CARD_FLIPPED',
  'FREE_EXPRESSION_DONE',
  // 페이월까지 봤다 — 투어는 다시 뜨지 않는다
  'COMPLETED',
] as const;
export type TourStep = (typeof TOUR_STEPS)[number];

// 투어가 지금 보여 줄 화면. 앞의 셋은 홈에서, 페이월은 페이월 라우트에서
export type TourScreen =
  'none' | 'challenge_intro' | 'flip_card' | 'free_expression' | 'paywall';

/** 마지막으로 끝낸 단계의 다음 화면 */
export const tourScreenOf = (step: TourStep | null): TourScreen => {
  switch (step) {
    case 'LEVEL_SEEN':
    case 'FEEDBACK_SEEN':
      return 'challenge_intro';
    case 'CHALLENGE_INTRO_SEEN':
      return 'flip_card';
    case 'CARD_FLIPPED':
      return 'free_expression';
    case 'FREE_EXPRESSION_DONE':
      return 'paywall';
    default:
      return 'none';
  }
};
