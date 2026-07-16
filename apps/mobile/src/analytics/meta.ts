// Meta(Facebook) SDK 초기화와 iOS ATT 동의 흐름 — 광고 설치 어트리뷰션·앱 이벤트 수집용
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Settings } from 'react-native-fbsdk-next';

// 앱 첫 진입에 1회 호출한다(mount 이펙트). iOS는 ATT 동의를 받아 그 결과로 광고 추적을 켜고, Android는 GAID로 바로 수집된다.
export async function initMetaSdk(): Promise<void> {
  Settings.initializeSDK();

  if (Platform.OS === 'ios') {
    // iOS 14.5+는 ATT 동의 전까지 IDFA를 못 쓴다 — 동의 여부를 그대로 광고 추적 설정에 반영한다
    const { granted } = await requestTrackingPermissionsAsync();
    await Settings.setAdvertiserTrackingEnabled(granted);
  }
}
