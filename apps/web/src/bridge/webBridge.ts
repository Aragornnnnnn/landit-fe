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

// 개발 모드에서만 로그를 남긴다
const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development')
    console.log('[bridge:web]', ...args);
};
const warn = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development')
    console.warn('[bridge:web]', ...args);
};

// 네이티브로 메시지를 보낸다. WebView 밖(일반 브라우저)이면 아무 일도 안 하고 false를 반환한다
export function postToNative(message: WebToNativeMessage) {
  const webview =
    typeof window !== 'undefined' ? window.ReactNativeWebView : undefined;
  if (!webview) {
    warn('WebView 밖이라 발신 스킵:', message);
    return false;
  }

  log('web -> native:', message.type, message);
  webview.postMessage(serializeBridgeMessage(message));
  return true;
}

// 네이티브에서 오는 메시지를 구독한다. 검증을 통과한 메시지만 listener로 넘기고, 구독 해제 함수를 돌려준다
export function subscribeFromNative(listener: BridgeListener) {
  const handler = (event: MessageEvent) => {
    const message = parseNativeToWebMessage(event.data);
    if (!message) return;

    log('native -> web:', message.type, message);
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
