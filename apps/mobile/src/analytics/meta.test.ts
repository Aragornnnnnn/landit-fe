// initMetaSdk의 플랫폼 분기 계약을 검증한다 — iOS는 ATT 동의 후 그 결과로 광고 추적을 설정하고 결과를 보관, Android는 ATT 생략, 끝나면 메타 익명 ID를 돌려준다
import { Platform } from 'react-native';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';

import { reportWarning } from '../monitoring/report';
import { initMetaSdk } from './meta';
import { trackingStatus } from './tracking-status';

jest.mock('react-native-fbsdk-next', () => ({
  AppEventsLogger: {
    getAnonymousID: jest.fn(() => Promise.resolve('fb-anon')),
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
  getTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'undetermined' }),
  ),
  requestTrackingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: 'granted' }),
  ),
}));

const mockGetTracking = getTrackingPermissionsAsync as jest.MockedFunction<
  typeof getTrackingPermissionsAsync
>;
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

  describe('ATT 결과 보관', () => {
    // 설정의 restoreMocks가 테스트마다 스파이를 풀어 매번 다시 건다
    let settle: jest.SpiedFunction<typeof trackingStatus.settle>;
    beforeEach(() => {
      settle = jest.spyOn(trackingStatus, 'settle');
    });

    it('묻기 전 상태가 미정이었으면 권한창을 띄운 것으로 보관한다', async () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      mockGetTracking.mockResolvedValueOnce({
        status: 'undetermined',
      } as never);
      mockRequestTracking.mockResolvedValueOnce({
        granted: false,
        status: 'denied',
      } as never);

      await initMetaSdk();

      expect(settle).toHaveBeenCalledWith({ status: 'denied', prompted: true });
    });

    it('이미 답해 둔 상태였으면 권한창 없이 상태만 보관한다', async () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      mockGetTracking.mockResolvedValueOnce({ status: 'granted' } as never);
      mockRequestTracking.mockResolvedValueOnce({
        granted: true,
        status: 'granted',
      } as never);

      await initMetaSdk();

      expect(settle).toHaveBeenCalledWith({
        status: 'granted',
        prompted: false,
      });
    });

    it('요청 뒤에도 미정이면 권한창이 뜨지 않은 것으로 보관한다', async () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      mockGetTracking.mockResolvedValueOnce({
        status: 'undetermined',
      } as never);
      mockRequestTracking.mockResolvedValueOnce({
        granted: false,
        status: 'undetermined',
      } as never);

      await initMetaSdk();

      expect(settle).toHaveBeenCalledWith({
        status: 'undetermined',
        prompted: false,
      });
    });

    it('Android면 결과 없음으로 보관한다', async () => {
      jest.replaceProperty(Platform, 'OS', 'android');

      await initMetaSdk();

      expect(settle).toHaveBeenCalledWith(null);
    });

    it('ATT 요청이 실패하면 결과 없음으로 보관한다', async () => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      mockRequestTracking.mockRejectedValueOnce(new Error('att failed'));

      await initMetaSdk();

      expect(settle).toHaveBeenCalledWith(null);
    });
  });
});
