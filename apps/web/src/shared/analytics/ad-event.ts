// 광고 최적화용 이벤트를 셸에 넘긴다 — 메타 SDK는 셸에만 있어 셸이 메타 표준 이벤트로 기록한다
import { type AdEvent } from '@landit/bridge';

import { getNativeContext } from '@/shared/bridge/native-context';
import { postToNative } from '@/shared/bridge/web-bridge';
import { seenFlag, type SeenFlag } from '@/shared/lib/seen-flag';

// LOG_AD_EVENT를 알아듣는 최소 브릿지 계약 버전
const AD_EVENT_BRIDGE_VERSION = 12;

/**
 * 광고 이벤트를 셸에 보낸다. 옛 셸은 모르는 메시지를 말없이 버리므로 버전으로 거른다.
 *
 * @returns 셸에 보냈으면 `true`
 */
export const sendAdEvent = (event: AdEvent) => {
  const context = getNativeContext();
  if (!context || context.bridgeVersion < AD_EVENT_BRIDGE_VERSION) return false;
  return postToNative({ type: 'LOG_AD_EVENT', event });
};

// 계정마다 보냈는가를 기기에 남긴다 — 같은 폰에서 계정을 바꾸거나 탈퇴 후 다시 가입해도 그 계정의 처음은 간다.
// seenFlag는 만들 때마다 탈퇴 정리 목록에 쌓여서 키마다 하나만 만든다
const flags = new Map<string, SeenFlag>();
const sentFlag = (key: string) => {
  const flag = flags.get(key) ?? seenFlag(`landit-ad-${key}`);
  flags.set(key, flag);
  return flag;
};

// 저장소를 못 쓰는 기기에서도 이번 실행 안에서는 두 번 보내지 않는다
const sentInSession = new Set<string>();

/**
 * 계정마다 한 번만 보낼 광고 이벤트(가입·첫 완료)를 보낸다. 셸에 실제로 보낸 뒤에만 보냈다고 남겨,
 * 옛 앱이라 못 보냈으면 앱을 올린 뒤 처음 할 때 간다.
 */
export const sendAdEventOnce = (event: AdEvent, userId: number) => {
  const key = `${event}:${userId}`;
  if (sentInSession.has(key)) return;
  const flag = sentFlag(key);
  if (flag.has()) return;
  if (!sendAdEvent(event)) return;
  sentInSession.add(key);
  flag.mark();
};
