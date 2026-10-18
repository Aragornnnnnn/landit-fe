// 앱 안 별점 카드(OS 리뷰 요청)를 띄우고 떴는지 돌려준다 — iOS는 우리 네이티브 모듈이 창을 감지하고,
// Android는 Google Play 인앱 리뷰(expo-store-review)를 부른 뒤 걸린 시간으로 판정한다. 둘 다 없으면 unavailable
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as StoreReview from 'expo-store-review';

export type ReviewPromptResult = 'shown' | 'not_shown' | 'unavailable';

interface ReviewPromptModule {
  // OS에 카드를 청하고, 카드 창이 2초 안에 보이면 shown, 아니면 not_shown
  requestReview(): Promise<'shown' | 'not_shown'>;
}

const iosModule =
  requireOptionalNativeModule<ReviewPromptModule>('ReviewPrompt');

// Play 인앱 리뷰는 떴는지 알려주지 않는다. 안 뜨면 요청이 수백 ms 안에 바로 끝나고,
// 뜨면 사용자가 별을 고르거나 닫을 때까지 걸린다 — 이보다 오래 걸렸으면 떴다고 본다
export const ANDROID_SHOWN_THRESHOLD_MS = 1000;

const requestAndroidReview = async (
  now: () => number = Date.now,
): Promise<ReviewPromptResult> => {
  // Play 스토어가 없는 기기(사이드로드·일부 에뮬레이터)엔 카드가 없다
  if (!(await StoreReview.isAvailableAsync())) return 'unavailable';
  const startedAt = now();
  await StoreReview.requestReview();
  return now() - startedAt >= ANDROID_SHOWN_THRESHOLD_MS
    ? 'shown'
    : 'not_shown';
};

// 플랫폼에 맞는 길로 카드를 청한다 — 호출하는 쪽은 플랫폼을 모른다
export const requestReviewPrompt = (
  now: () => number = Date.now,
): Promise<ReviewPromptResult> => {
  if (iosModule) return iosModule.requestReview();
  if (Platform.OS === 'android') return requestAndroidReview(now);
  return Promise.resolve('unavailable');
};
