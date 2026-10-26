// initMetaSdk의 플랫폼 분기(iOS ATT·Android 생략·메타 익명 ID)와 광고 이벤트의 메타 표준 이벤트 대응을 검증한다
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

import { reportWarning } from '../monitoring/report';
import { initMetaSdk, logAdEvent, logCheckoutStarted } from './meta';

jest.mock('react-native-fbsdk-next', () => ({
  AppEventsLogger: {
    getAnonymousID: jest.fn(() => Promise.resolve('fb-anon')),
    logEvent: jest.fn(),
    AppEvents: {
      CompletedRegistration: 'fb_mobile_complete_registration',
      CompletedTutorial: 'fb_mobile_tutorial_completion',
      ViewedContent: 'fb_mobile_content_view',
      InitiatedCheckout: 'fb_mobile_initiated_checkout',
      UnlockedAchievement: 'fb_mobile_achievement_unlocked',
    },
    AppEventParams: {
      ContentType: 'fb_content_type',
      ContentID: 'fb_content_id',
    },
  },
  Settings: {
    initializeSDK: jest.fn(),
    setAdvertiserTrackingEnabled: jest.fn(() => Promise.resolve(true)),
  },
}));
jest.mock('../monitoring/report', () => ({
  reportWarning: jest.fn(),
}));
jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true }),
  ),
}));

const mockRequestTracking =
  requestTrackingPermissionsAsync as jest.MockedFunction<
    typeof requestTrackingPermissionsAsync
  >;

describe('initMetaSdk', () => {
  it('iOS에서 ATT 동의를 요청하고 그 결과(거부)를 광고 추적 설정에 반영한다', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    mockRequestTracking.mockResolvedValueOnce({ granted: false } as never);

    await initMetaSdk();

    expect(Settings.initializeSDK).toHaveBeenCalledTimes(1);
    expect(mockRequestTracking).toHaveBeenCalledTimes(1);
    expect(Settings.setAdvertiserTrackingEnabled).toHaveBeenCalledWith(false);
  });

  it('Android에서는 ATT 요청 없이 SDK만 초기화한다', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    await initMetaSdk();

    expect(Settings.initializeSDK).toHaveBeenCalledTimes(1);
    expect(mockRequestTracking).not.toHaveBeenCalled();
    expect(Settings.setAdvertiserTrackingEnabled).not.toHaveBeenCalled();
  });

  it('ATT 결정이 끝난 뒤 메타 익명 ID를 돌려준다', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    let decide: () => void = () => {};
    mockRequestTracking.mockReturnValueOnce(
      new Promise((resolve) => {
        decide = () => resolve({ granted: true } as never);
      }),
    );

    const pending = initMetaSdk();
    await Promise.resolve();
    expect(AppEventsLogger.getAnonymousID).not.toHaveBeenCalled();

    decide();
    await expect(pending).resolves.toBe('fb-anon');
  });

  it('메타 익명 ID를 못 꺼내면 null을 돌려주고 경고로 보고한다', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const failure = new Error('no anon id');
    (AppEventsLogger.getAnonymousID as jest.Mock).mockRejectedValueOnce(
      failure,
    );

    await expect(initMetaSdk()).resolves.toBeNull();
    expect(reportWarning).toHaveBeenCalledWith(failure);
  });

  it('ATT 요청이 실패해도 경고로 보고하고 메타 익명 ID는 돌려준다', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const failure = new Error('att failed');
    mockRequestTracking.mockRejectedValueOnce(failure);

    await expect(initMetaSdk()).resolves.toBe('fb-anon');
    expect(reportWarning).toHaveBeenCalledWith(failure);
  });
});

describe('logAdEvent', () => {
  it('온보딩 완료는 메타 표준 이벤트 회원가입 완료로 기록한다', () => {
    logAdEvent('onboarding_completed');

    expect(AppEventsLogger.logEvent).toHaveBeenCalledWith(
      'fb_mobile_complete_registration',
    );
  });

  it('첫 시나리오 완료는 메타 표준 이벤트 튜토리얼 완료로 기록한다', () => {
    logAdEvent('first_scenario_talk_completed');

    expect(AppEventsLogger.logEvent).toHaveBeenCalledWith(
      'fb_mobile_tutorial_completion',
    );
  });

  it('첫 표현 학습 완료는 메타 표준 이벤트 업적 달성으로 기록한다', () => {
    logAdEvent('first_expression_completed');

    expect(AppEventsLogger.logEvent).toHaveBeenCalledWith(
      'fb_mobile_achievement_unlocked',
    );
  });

  it('페이월 조회는 콘텐츠 조회로, 콘텐츠 종류를 페이월로 실어 기록한다', () => {
    logAdEvent('paywall_viewed');

    expect(AppEventsLogger.logEvent).toHaveBeenCalledWith(
      'fb_mobile_content_view',
      { fb_content_type: 'paywall' },
    );
  });
});

describe('logCheckoutStarted', () => {
  it.each(['android', 'ios'] as const)(
    '%s에서 결제 시작을 고른 패키지와 함께 기록한다',
    (os) => {
      jest.replaceProperty(Platform, 'OS', os);

      logCheckoutStarted('$rc_annual');

      expect(AppEventsLogger.logEvent).toHaveBeenCalledWith(
        'fb_mobile_initiated_checkout',
        { fb_content_id: '$rc_annual' },
      );
    },
  );

  it('기록이 실패해도 던지지 않고 경고로 보고한다 — 결제 시트가 막히면 안 된다', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const failure = new Error('no native module');
    (AppEventsLogger.logEvent as jest.Mock).mockImplementationOnce(() => {
      throw failure;
    });

    expect(() => logCheckoutStarted('$rc_annual')).not.toThrow();
    expect(reportWarning).toHaveBeenCalledWith(failure);
  });
});
