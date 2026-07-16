// 셸이 웹에 내려줄 네이티브 컨텍스트를 expo-constants·Platform에서 조립해 주입 스크립트로 만든다
import { Platform } from 'react-native';
import {
  buildNativeContextScript,
  NATIVE_BRIDGE_VERSION,
  type NativeContext,
} from '@landit/bridge';
import Constants from 'expo-constants';

// iOS는 buildNumber(문자열), Android는 versionCode(숫자) — 둘 다 문자열로 통일, 없으면 null
function resolveBuildNumber(): string | null {
  const expoConfig = Constants.expoConfig;
  if (Platform.OS === 'ios') return expoConfig?.ios?.buildNumber ?? null;
  const versionCode = expoConfig?.android?.versionCode;
  return versionCode != null ? String(versionCode) : null;
}

export function getNativeContext(): NativeContext {
  return {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    buildNumber: resolveBuildNumber(),
    bridgeVersion: NATIVE_BRIDGE_VERSION,
  };
}

// WebView injectedJavaScriptBeforeContentLoaded에 넣는다 — 콘텐츠 로드 전 window에 컨텍스트를 세팅한다
export const nativeContextScript = buildNativeContextScript(getNativeContext());
