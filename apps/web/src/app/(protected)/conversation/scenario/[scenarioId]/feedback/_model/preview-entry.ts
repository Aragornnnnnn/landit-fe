// 피드백을 마친 사람이 여기서 프리미엄 프리뷰를 시작하는지 — 피드백 뒤 갈 곳(decidePostFeedbackView) 위에 얹는 판정
import type { PreviewStep } from '@/features/premium-preview/model/preview-step';

import type { PostFeedbackView } from './post-feedback-view';

/**
 * 프리뷰를 어디서 시작하는가(서버가 무료 표현을 열어 줬는지는 부르는 쪽이 따로 확인한다) — level은 레벨 결과를 보고 나서(신규), home은 바로 홈으로(기존). 시작하지 않으면 null
 *
 * @param view 피드백 뒤 원래 갈 곳 — analyzing은 무료 첫 시나리오, home은 무료 두 번째부터(또는 재대화)
 * @param today 오늘 카드의 대화인가 — 프리뷰는 홈의 오늘 카드에서 이어 가므로 오늘 카드에서만 시작한다
 * @param premiumPreview 프리뷰를 볼 수 있는 사람인지(eligible)와 기기에 남은 단계
 */
export const previewEntryOf = ({
  view,
  replay,
  today,
  premiumPreview,
}: {
  view: PostFeedbackView;
  replay: boolean;
  today: boolean;
  premiumPreview: { eligible: boolean; step: PreviewStep | null };
}): 'level' | 'home' | null => {
  // 오늘 카드에서만 — 프리뷰는 홈의 오늘 카드를 뒤집어 이어 간다
  if (
    !premiumPreview.eligible ||
    premiumPreview.step !== null ||
    replay ||
    !today
  )
    return null;
  if (view === 'analyzing') return 'level';
  if (view === 'home') return 'home';
  return null;
};
