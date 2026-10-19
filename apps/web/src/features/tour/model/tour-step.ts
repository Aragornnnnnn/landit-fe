// 첫 표현 투어 단계와 다음 화면 — 저장된 마지막 단계로 지금 보여 줄 화면을 정한다

// 마지막으로 끝낸 단계. 시작 전은 null
export const TOUR_STEPS = [
  // 피드백을 마치고 홈으로 왔다 — 신규는 레벨 결과 뒤, 기존은 오늘의 시나리오 총평 뒤
  'STARTED',
  'TUTORIAL_DONE',
  'CARD_FLIPPED',
  // 무료 표현을 마치고 페이월로 갔거나, 투어를 넘겼다 — 다시 뜨지 않는다
  'COMPLETED',
] as const;
export type TourStep = (typeof TOUR_STEPS)[number];

// 투어가 지금 보여 줄 화면. 전부 홈에서
export type TourScreen = 'none' | 'tutorial' | 'flip_card' | 'free_expression';

/** 마지막으로 끝낸 단계의 다음 화면 */
export const tourScreenOf = (step: TourStep | null): TourScreen => {
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
