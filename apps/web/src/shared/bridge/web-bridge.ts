'use client';

// WebView postMessage 브릿지의 웹 쪽 — 네이티브로 보내고(postToNative), 네이티브에서 오는 메시지를 구독한다(subscribeFromNative)
import {
  parseNativeToWebMessage,
  serializeBridgeMessage,
  type NativeToWebMessage,
  type WebToNativeMessage,
} from '@landit/bridge';

type BridgeListener = (message: NativeToWebMessage) => void;

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

/**
 * 네이티브 셸로 메시지를 보낸다.
 *
 * @param message 웹→네이티브 브릿지 메시지 (`@landit/bridge` 프로토콜 타입)
 * @returns 전송했으면 `true`, WebView 밖(일반 브라우저)이라 보낼 곳이 없으면 `false` —
 *   호출부는 이 값으로 네이티브/웹 단독 경로를 분기한다
 */
export function postToNative(message: WebToNativeMessage) {
  const webview =
    typeof window !== 'undefined' ? window.ReactNativeWebView : undefined;
  if (!webview) {
    console.debug('[bridge:web] WebView 밖이라 발신 스킵:', message);
    return false;
  }

  console.debug('[bridge:web] web -> native:', message.type, message);
  webview.postMessage(serializeBridgeMessage(message));
  return true;
}

/**
 * 네이티브에서 오는 메시지를 구독한다. 검증(파싱)을 통과한 메시지만 전달한다.
 *
 * @param listener 유효한 네이티브→웹 메시지를 받을 콜백
 * @returns 구독 해제 함수 — 보통 useEffect의 cleanup으로 그대로 반환한다
 */
export function subscribeFromNative(listener: BridgeListener) {
  const handler = (event: MessageEvent) => {
    const message = parseNativeToWebMessage(event.data);
    if (!message) return;

    console.debug('[bridge:web] native -> web:', message.type, message);
    listener(message);
  };

  // iOS WebView는 window로, Android는 document로 메시지가 온다
  window.addEventListener('message', handler);
  document.addEventListener('message', handler as EventListener);

  return () => {
    window.removeEventListener('message', handler);
    document.removeEventListener('message', handler as EventListener);
  };
}
