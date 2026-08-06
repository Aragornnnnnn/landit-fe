'use client';

// 업데이트 유도 UI의 스토어 이동 — /download를 거치지 않고 스토어 앱을 바로 열고, 그만큼 계측도 여기서 남긴다
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { getNativeContext } from '@/shared/bridge/native-context';

import { resolveStoreTarget } from './resolveStoreTarget';

export const goToStore = () => {
  const { url, store } = resolveStoreTarget(
    getNativeContext()?.platform ?? null,
  );

  if (store) {
    track(EVENTS.DOWNLOAD_LINK_VISITED, { store, source: 'app_update' });
  }
  window.location.href = url;
};
