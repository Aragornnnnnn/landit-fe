// 앱 안 별점 카드(OS 리뷰 요청)를 띄우고 떴는지 돌려주는 네이티브 모듈 — iOS에만 존재한다 (안드로이드·Expo Go는 unavailable)
import { requireOptionalNativeModule } from 'expo';

export type ReviewPromptResult = 'shown' | 'not_shown' | 'unavailable';

interface ReviewPromptModule {
  // OS에 카드를 청하고, 카드 창이 2초 안에 보이면 shown, 아니면 not_shown
  requestReview(): Promise<'shown' | 'not_shown'>;
}

const module = requireOptionalNativeModule<ReviewPromptModule>('ReviewPrompt');

// 모듈이 없는 플랫폼·환경에서는 카드가 없다 — 웹이 지금처럼 스토어로 보낸다
export const requestReviewPrompt = (): Promise<ReviewPromptResult> =>
  module?.requestReview() ?? Promise.resolve('unavailable');
