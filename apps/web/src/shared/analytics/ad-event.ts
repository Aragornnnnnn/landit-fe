// 광고 최적화용 이벤트를 셸에 넘긴다 — 메타 SDK는 셸에만 있어 셸이 메타 표준 이벤트로 기록한다
import { type AdEvent } from '@landit/bridge';

import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';

// LOG_AD_EVENT를 알아듣는 최소 브릿지 계약 버전
const AD_EVENT_BRIDGE_VERSION = 12;

/**
 * 광고 이벤트를 셸에 보낸다. 옛 셸은 모르는 메시지를 말없이 버리므로 버전으로 거른다.
 *
 * @returns 셸에 보냈으면 `true` — 한 번만 보낼 이벤트는 이 값을 보고 보냈다고 남긴다
 */
export const sendAdEvent = (event: AdEvent) => {
  const context = getNativeContext();
  if (!context || context.bridgeVersion < AD_EVENT_BRIDGE_VERSION) return false;
  return postToNative({ type: 'LOG_AD_EVENT', event });
};
