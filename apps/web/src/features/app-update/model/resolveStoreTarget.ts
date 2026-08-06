// 업데이트 유도 UI의 스토어 이동 대상 — 열 주소와 계측에 남길 스토어 이름을 함께 정한다
import type { EventProps } from '@landit/analytics';
import type { NativeContext } from '@landit/bridge';

import {
  APP_STORE_APP_URL,
  PLAY_STORE_APP_URL,
} from '@/shared/lib/store-listing';

type StoreName = EventProps['Download Link Visited']['store'];

export interface StoreTarget {
  url: string;
  // 계측에 남길 스토어. null이면 /download가 UA로 판별해 서버에서 대신 발화한다
  store: StoreName | null;
}

// source — 인스타 등 외부 링크 유입과 구분해 계측한다
const FALLBACK_URL = '/download?source=app_update';

export const resolveStoreTarget = (
  platform: NativeContext['platform'] | null,
): StoreTarget => {
  if (platform === 'android') {
    return { url: PLAY_STORE_APP_URL, store: 'play_store' };
  }
  if (platform === 'ios') {
    return { url: APP_STORE_APP_URL, store: 'app_store' };
  }
  return { url: FALLBACK_URL, store: null };
};
