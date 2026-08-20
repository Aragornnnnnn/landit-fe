// 리뷰 남기러 가기 — 앱 셸이면 스토어 앱을, 브라우저면 스토어 웹을 연다. 열 주소와 계측에 남길 스토어 이름을 함께 정한다
import type { EventProps } from '@landit/analytics';
import type { NativeContext } from '@landit/bridge';

import {
  APP_STORE_APP_URL,
  APP_STORE_URL,
  PLAY_STORE_APP_URL,
  PLAY_STORE_URL,
} from '@/shared/lib/store-listing';

type StoreName = EventProps['Review Store Opened']['store'];

export interface ReviewStore {
  url: string;
  store: StoreName;
}

// 앱스토어는 리뷰 작성 화면으로 바로 가는 액션이 있다. 플레이는 없어서 상세 페이지까지만
const APP_STORE_REVIEW_ACTION = '?action=write-review';

export const resolveReviewStore = (
  platform: NativeContext['platform'] | null,
  userAgent: string,
): ReviewStore => {
  if (platform === 'android')
    return { url: PLAY_STORE_APP_URL, store: 'play_store' };
  if (platform === 'ios')
    return {
      url: `${APP_STORE_APP_URL}${APP_STORE_REVIEW_ACTION}`,
      store: 'app_store',
    };
  // 브라우저 — 셸이 없어 UA로 가른다
  return /android/i.test(userAgent)
    ? { url: PLAY_STORE_URL, store: 'play_store' }
    : { url: `${APP_STORE_URL}${APP_STORE_REVIEW_ACTION}`, store: 'app_store' };
};
