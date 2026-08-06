// 셸이 웹에 내려줄 네이티브 컨텍스트를 expo-application·Platform에서 조립해 주입 스크립트로 만든다
import { Platform } from 'react-native';
import {
  buildNativeContextScript,
  NATIVE_BRIDGE_VERSION,
  type NativeContext,
} from '@landit/bridge';
import { nativeBuildVersion } from 'expo-application';
import Constants from 'expo-constants';

export function getNativeContext(): NativeContext {
  return {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    // 바이너리에 박힌 번호를 읽는다 (iOS CFBundleVersion, Android versionCode).
    // app.json을 읽으면 EAS가 빌드 때 매긴 번호를 놓친다 — 안드로이드는 아예 없고, iOS는 옛 번호가 나간다
    buildNumber: nativeBuildVersion,
    bridgeVersion: NATIVE_BRIDGE_VERSION,
  };
}

// WebView injectedJavaScriptBeforeContentLoaded에 넣는다 — 콘텐츠 로드 전 window에 컨텍스트를 세팅한다
export const nativeContextScript = buildNativeContextScript(getNativeContext());
