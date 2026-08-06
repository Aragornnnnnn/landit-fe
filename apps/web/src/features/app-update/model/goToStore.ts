'use client';

// 업데이트 유도 UI의 스토어 이동 — /download를 거치지 않고 스토어 앱을 바로 열고, 그만큼 계측도 여기서 남긴다
import { EVENTS } from '@landit/analytics';

import { track } from '@/shared/analytics';
import { getNativeContext } from '@/shared/bridge/native-context';

import { resolveStoreTarget } from './resolveStoreTarget';

export const goToStore = () => {
  // AppUpdateGate가 surface === 'app' && nativeContext !== null일 때만 이 버튼을 렌더링한다 —
  // 여기 도달했는데 null이면 그 전제가 깨진 버그이니 조용히 /download로 새지 않고 그대로 터뜨린다
  const { platform } = getNativeContext()!;
  const { url, store } = resolveStoreTarget(platform);

  track(EVENTS.APP_UPDATE_STORE_OPENED, { store });
  window.location.href = url;
};
