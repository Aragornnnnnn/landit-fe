// Meta(Facebook) SDK 초기화와 iOS ATT 동의 흐름 — 광고 설치 어트리뷰션·앱 이벤트 수집용
import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

import { reportWarning } from '../monitoring/report';
import { trackingStatus } from './tracking-status';

// 앱 첫 진입에 1회 호출한다(mount 이펙트). iOS는 ATT 동의를 받아 그 결과로 광고 추적을 켜고, Android는 GAID로 바로 수집된다.
// 끝나면 메타 익명 ID를 돌려준다 — RevenueCat이 결제 이벤트를 이 기기로 메타에 보낼 때 쓴다
export async function initMetaSdk(): Promise<string | null> {
  Settings.initializeSDK();

  if (Platform.OS === 'ios') {
    // iOS 14.5+는 ATT 동의 전까지 IDFA를 못 쓴다 — 동의 여부를 그대로 광고 추적 설정에 반영한다
    try {
      // 묻기 전엔 미정이었다가 답이 정해졌으면 이번에 권한창에 답한 것이다 — 앱이 활성 전이면 창 없이 미정이 그대로 돌아온다
      const before = await getTrackingPermissionsAsync();
      const { granted, status } = await requestTrackingPermissionsAsync();
      trackingStatus.settle({
        status,
        prompted: before.status === 'undetermined' && status !== 'undetermined',
      });
      await Settings.setAdvertiserTrackingEnabled(granted);
    } catch (error) {
      reportWarning(error);
      trackingStatus.settle(null);
    }
  } else {
    trackingStatus.settle(null);
  }

  // 실패해도 null로 넘겨, RevenueCat에 광고 ID만이라도 붙게 한다
  try {
    return await AppEventsLogger.getAnonymousID();
  } catch (error) {
    reportWarning(error);
    return null;
  }
}
