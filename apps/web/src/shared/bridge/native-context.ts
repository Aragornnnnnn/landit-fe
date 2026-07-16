'use client';

// 셸이 주입한 네이티브 컨텍스트를 읽는다 — 앱/브라우저 구분(surface)과 앱 버전·플랫폼. 웹 계측에서 소비한다
import { readNativeContext, type NativeContext } from '@landit/bridge';

export type Surface = 'app' | 'browser';

declare global {
  interface Window {
    // 셸이 injectedJavaScriptBeforeContentLoaded로 세팅한다 (@landit/bridge NATIVE_CONTEXT_GLOBAL)
    __LANDIT_NATIVE__?: unknown;
  }
}

// 셸(WebView) 안이면 컨텍스트, 일반 브라우저면 null. 주입은 콘텐츠 로드 전에 끝나 있어 첫 호출에서 바로 읽힌다
export function getNativeContext(): NativeContext | null {
  if (typeof window === 'undefined') return null;
  return readNativeContext(window.__LANDIT_NATIVE__);
}

// 실행 표면 — 셸 안이면 'app', 아니면 'browser'
export function getSurface(): Surface {
  return getNativeContext() ? 'app' : 'browser';
}
