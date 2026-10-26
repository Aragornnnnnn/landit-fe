// Meta(Facebook) SDK 초기화와 iOS ATT 동의 흐름, 웹이 알린 광고 이벤트 기록 — 광고 설치 어트리뷰션·앱 이벤트 수집용
import { Platform } from 'react-native';
import type { AdEvent } from '@landit/bridge';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

import { reportWarning } from '../monitoring/report';

// 앱 첫 진입에 1회 호출한다(mount 이펙트). iOS는 ATT 동의를 받아 그 결과로 광고 추적을 켜고, Android는 GAID로 바로 수집된다.
// 끝나면 메타 익명 ID를 돌려준다 — RevenueCat이 결제 이벤트를 이 기기로 메타에 보낼 때 쓴다
export async function initMetaSdk(): Promise<string | null> {
  Settings.initializeSDK();

  if (Platform.OS === 'ios') {
    // iOS 14.5+는 ATT 동의 전까지 IDFA를 못 쓴다 — 동의 여부를 그대로 광고 추적 설정에 반영한다
    try {
      const { granted } = await requestTrackingPermissionsAsync();
      await Settings.setAdvertiserTrackingEnabled(granted);
    } catch (error) {
      reportWarning(error);
    }
  }

  // 실패해도 null로 넘겨, RevenueCat에 광고 ID만이라도 붙게 한다
  try {
    return await AppEventsLogger.getAnonymousID();
  } catch (error) {
    reportWarning(error);
    return null;
  }
}

// 웹이 알린 일을 메타 표준 이벤트로 기록한다 — 표준 이벤트여야 광고 관리자에서 최적화 목표로 고를 수 있다
export const logAdEvent = (event: AdEvent) => {
  const { AppEvents, AppEventParams } = AppEventsLogger;
  switch (event) {
    case 'onboarding_completed':
      AppEventsLogger.logEvent(AppEvents.CompletedRegistration);
      return;
    case 'first_scenario_completed':
      AppEventsLogger.logEvent(AppEvents.CompletedTutorial);
      return;
    case 'paywall_viewed':
      AppEventsLogger.logEvent(AppEvents.ViewedContent, {
        [AppEventParams.ContentType]: 'paywall',
      });
      return;
    default:
      // 새 광고 이벤트를 더하면 여기서 타입 에러가 나 대응을 빠뜨리지 않는다
      event satisfies never;
  }
};
