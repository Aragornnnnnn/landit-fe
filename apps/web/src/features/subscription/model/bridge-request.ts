// 브릿지 왕복 한 번을 Promise로 — 회신 구독을 먼저 걸고 요청을 보낸 뒤, 골라낸 회신 하나로 끝낸다.
// 보낼 곳이 없거나(브라우저) 제한 시간이 지나면 null. 결제 시트는 사용자가 오래 붙잡을 수 있어 호출부가 시간을 정한다
import type { NativeToWebMessage, WebToNativeMessage } from '@landit/bridge';

import { postToNative, subscribeFromNative } from '@/shared/bridge/web-bridge';

export interface BridgeTransport {
  post: (message: WebToNativeMessage) => boolean;
  subscribe: (listener: (message: NativeToWebMessage) => void) => () => void;
}

// 실제 셸과 이어지는 기본 통로 — 테스트는 대역을 넣는다
export const webBridge: BridgeTransport = {
  post: postToNative,
  subscribe: subscribeFromNative,
};

export const requestFromNative = <T extends NativeToWebMessage>(
  bridge: BridgeTransport,
  request: WebToNativeMessage,
  pick: (message: NativeToWebMessage) => T | null,
  timeoutMs: number,
): Promise<T | null> =>
  new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => {};
    // 회신이 요청보다 먼저 끝날 수 있어(브라우저 경로) 타이머는 나중에 채운다
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(value);
    };

    unsubscribe = bridge.subscribe((message) => {
      const picked = pick(message);
      if (picked) finish(picked);
    });

    if (!bridge.post(request)) {
      finish(null);
      return;
    }
    timer = setTimeout(() => finish(null), timeoutMs);
  });
