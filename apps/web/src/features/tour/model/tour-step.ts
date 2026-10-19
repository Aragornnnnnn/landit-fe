// 첫 표현 투어 규칙 — 저장된 단계로 다음 화면을 정하고, 피드백 뒤에 투어를 시작할지 정한다

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
  'none' | 'challenge_intro' | 'auto_flip' | 'free_expression' | 'paywall';

/** 마지막으로 끝낸 단계의 다음 화면 */
export const tourScreenOf = (step: TourStep | null): TourScreen => {
  switch (step) {
    case 'LEVEL_SEEN':
    case 'FEEDBACK_SEEN':
      return 'challenge_intro';
    case 'CHALLENGE_INTRO_SEEN':
      return 'auto_flip';
    case 'CARD_FLIPPED':
      return 'free_expression';
    case 'FREE_EXPRESSION_DONE':
      return 'paywall';
    default:
      return 'none';
  }
};

/**
 * 피드백을 마친 사람이 여기서 투어를 시작하면 저장할 첫 단계. 시작하지 않으면 null
 *
 * @param view 피드백 뒤 원래 갈 곳 — analyzing은 무료 첫 시나리오, home은 무료 두 번째부터(또는 재대화)
 * @param today 오늘 카드의 대화인가 — 기존 사용자는 오늘의 시나리오에서만 시작한다
 * @param tour 투어를 볼 수 있는 사람인지(known)와 기기에 남은 단계
 * @param freeExpression 서버가 이 시나리오에서 무료로 열어 준 표현(freeTrial)이 있는가 — 없으면 투어의 끝을 줄 수 없어 시작하지 않는다
 */
export const tourEntryOf = ({
  view,
  replay,
  today,
  tour,
  freeExpression,
}: {
  view: 'home' | 'branch' | 'analyzing';
  replay: boolean;
  today: boolean;
  tour: { known: boolean; step: TourStep | null };
  freeExpression: boolean;
}): TourStep | null => {
  if (!tour.known || tour.step !== null || replay || !freeExpression) {
    return null;
  }
  if (view === 'analyzing') return 'LEVEL_SEEN';
  if (view === 'home' && today) return 'FEEDBACK_SEEN';
  return null;
};
