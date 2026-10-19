// 앱 안 별점 카드(OS 리뷰 요청)를 띄우고 떴는지 돌려준다 — OS는 떴는지 알려주지 않아 네이티브 모듈이 감지한다.
// iOS는 카드 창이 0.5초 안에 보이는지, Android는 Play 카드 단계가 1초 안에 끝나 버리는지로 판정한다
import { requireOptionalNativeModule } from 'expo';

export type ReviewPromptResult = 'shown' | 'not_shown' | 'unavailable';

interface ReviewPromptModule {
  requestReview(): Promise<ReviewPromptResult>;
}

const nativeModule =
  requireOptionalNativeModule<ReviewPromptModule>('ReviewPrompt');

// 모듈이 없는 환경(웹·옛 바이너리)엔 카드가 없다
export const requestReviewPrompt = (): Promise<ReviewPromptResult> =>
  nativeModule ? nativeModule.requestReview() : Promise.resolve('unavailable');
