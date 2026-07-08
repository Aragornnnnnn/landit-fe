// WebView postMessage 브릿지의 네이티브 쪽 — 웹 메시지를 검증해 핸들러로 분배하고, 네이티브 메시지를 웹으로 보낸다
import type { RefObject } from 'react';
import {
  parseWebToNativeMessage,
  serializeBridgeMessage,
  type NativeToWebMessage,
  type WebToNativeMessage,
} from '@landit/bridge';
import type WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

// TType에 해당하는 메시지 모양만 뽑아낸다 (예: 'EXIT_APP' -> { type: 'EXIT_APP' })
type MessageOfType<TType extends WebToNativeMessage['type']> = Extract<
  WebToNativeMessage,
  { type: TType }
>;

// 메시지 type별 핸들러 맵 — 페이로드 타입이 자동으로 좁혀진다
export type WebMessageHandlers = {
  [TType in WebToNativeMessage['type']]?: (
    message: MessageOfType<TType>,
  ) => void | Promise<void>;
};

// 개발 모드에서만 로그를 남긴다
function log(...args: unknown[]) {
  if (__DEV__) console.log('[bridge:native]', ...args);
}
function warn(...args: unknown[]) {
  if (__DEV__) console.warn('[bridge:native]', ...args);
}

// WebView와 브릿지를 연결한다. 반환값의 onMessage를 WebView에 연결하고, postToWeb으로 웹에 발신한다
export function useNativeBridge(
  webviewRef: RefObject<WebView | null>,
  handlers: WebMessageHandlers,
) {
  // 웹으로 메시지를 보낸다. WebView가 아직 없으면(마운트 전) 조용히 스킵한다
  const postToWeb = (message: NativeToWebMessage) => {
    if (!webviewRef.current) {
      warn('WebView ref가 없어 발신 스킵:', message);
      return;
    }
    log('native -> web:', message.type, message);
    webviewRef.current.postMessage(serializeBridgeMessage(message));
  };

  const onMessage = (event: WebViewMessageEvent) => {
    const message = parseWebToNativeMessage(event.nativeEvent.data);
    if (!message) {
      warn('web -> native 폐기:', event.nativeEvent.data);
      return;
    }

    // message.type으로 찾은 핸들러를, WebToNativeMessage 전체를 받는 함수로 단언한다
    const handler = handlers[message.type] as
      ((m: WebToNativeMessage) => void | Promise<void>) | undefined;

    if (!handler) {
      warn(`${message.type} 핸들러 없음:`, message);
      return;
    }

    log('web -> native:', message.type, message);

    // handler를 비동기로 실행하고, 동기/비동기 실패를 모두 catch로 잡는다
    Promise.resolve()
      .then(() => handler(message))
      .catch((error) => {
        console.error(`[bridge] ${message.type} 핸들러 실패:`, error);
      });
  };

  return { onMessage, postToWeb };
}
