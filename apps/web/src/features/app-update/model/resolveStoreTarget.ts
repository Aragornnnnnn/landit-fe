// 업데이트 유도 UI의 스토어 이동 대상 — 열 주소와 계측에 남길 스토어 이름을 함께 정한다
import type { EventProps } from '@landit/analytics';
import type { NativeContext } from '@landit/bridge';

import {
  APP_STORE_APP_URL,
  PLAY_STORE_APP_URL,
} from '@/shared/lib/store-listing';

type StoreName = EventProps['App Update Store Opened']['store'];

export interface StoreTarget {
  url: string;
  store: StoreName;
}

export const resolveStoreTarget = (
  platform: NativeContext['platform'],
): StoreTarget =>
  platform === 'android'
    ? { url: PLAY_STORE_APP_URL, store: 'play_store' }
    : { url: APP_STORE_APP_URL, store: 'app_store' };
