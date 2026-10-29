// 셸이 웹에 내려줄 네이티브 컨텍스트를 expo-application·Platform에서 조립해 주입 스크립트로 만든다
import { PixelRatio, Platform } from 'react-native';
import {
  buildNativeContextScript,
  NATIVE_BRIDGE_VERSION,
  type NativeContext,
} from '@landit/bridge';
import { nativeBuildVersion } from 'expo-application';
import Constants from 'expo-constants';

import { deviceLanguageTags } from '@/i18n/shell-locale';

import { getDeviceId } from './deviceId';

export function getNativeContext(): NativeContext {
  return {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    // 바이너리에 박힌 번호를 읽는다 (iOS CFBundleVersion, Android versionCode).
    // app.json을 읽으면 EAS가 빌드 때 매긴 번호를 놓친다 — 안드로이드는 아예 없고, iOS는 옛 번호가 나간다
    buildNumber: nativeBuildVersion,
    bridgeVersion: NATIVE_BRIDGE_VERSION,
    // 기기 글자 크기 설정 배율 (iOS 동적 글자·Android 글꼴 크기)
    fontScale: PixelRatio.getFontScale(),
    // 웹은 아직 서버로 보내지 않는다 — 친구 초대 같은 기기 판정을 백엔드가 받기로 하면 쓴다
    deviceId: getDeviceId(),
    // 기기 선호 언어 목록 — iOS WebView의 navigator.languages는 첫 언어만 줄 수 있다
    languages: deviceLanguageTags(),
  };
}

// WebView injectedJavaScriptBeforeContentLoaded에 넣는다 — 콘텐츠 로드 전 window에 컨텍스트를 세팅한다
export const nativeContextScript = buildNativeContextScript(getNativeContext());
