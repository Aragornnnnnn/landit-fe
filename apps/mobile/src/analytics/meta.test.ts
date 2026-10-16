// initMetaSdk의 플랫폼 분기 계약을 검증한다 — iOS는 ATT 동의 후 그 결과로 광고 추적을 설정, Android는 ATT 생략, 끝나면 메타 익명 ID를 돌려준다
import { Platform } from 'react-native';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

import { initMetaSdk } from './meta';

jest.mock('react-native-fbsdk-next', () => ({
  AppEventsLogger: {
    getAnonymousID: jest.fn(() => Promise.resolve('fb-anon')),
  },
  Settings: {
    initializeSDK: jest.fn(),
    setAdvertiserTrackingEnabled: jest.fn(() => Promise.resolve(true)),
  },
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
});
