// 기기 ID 읽기 — iOS는 키체인 UUID를 한 번 만들어 재사용하고, Android는 ANDROID_ID를 그대로 쓰는지
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { reportWarning } from '@/monitoring/report';

import { getDeviceId } from './deviceId';

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock-this-device-only',
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('@/monitoring/report', () => ({ reportWarning: jest.fn() }));

const mockStore = jest.mocked(SecureStore);

describe('getDeviceId — iOS', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('키체인에 저장된 ID가 있으면 그대로 돌려준다', () => {
    // Given 키체인에 이미 ID가 있다
    mockStore.getItem.mockReturnValue('saved-id');

    // When 기기 ID를 읽으면
    const id = getDeviceId();

    // Then 저장된 값을 쓰고 새로 만들지 않는다
    expect(id).toBe('saved-id');
    expect(mockStore.setItem).not.toHaveBeenCalled();
  });

  it('키체인에 없으면 UUID를 만들어 저장하고 돌려준다', () => {
    // Given 처음 실행이라 키체인이 비어 있다
    mockStore.getItem.mockReturnValue(null);
    jest.spyOn(Crypto, 'randomUUID').mockReturnValue('new-uuid');

    // When 기기 ID를 읽으면
    const id = getDeviceId();

    // Then 새 UUID를 이 기기에만 남는 키체인 항목으로 저장한다
    expect(id).toBe('new-uuid');
    expect(mockStore.setItem).toHaveBeenCalledWith(
      expect.any(String),
      'new-uuid',
      expect.objectContaining({
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      }),
    );
  });

  it('읽기와 저장에 같은 키를 쓴다', () => {
    mockStore.getItem.mockReturnValue(null);
    jest.spyOn(Crypto, 'randomUUID').mockReturnValue('new-uuid');

    getDeviceId();

    expect(mockStore.setItem.mock.calls[0][0]).toBe(
      mockStore.getItem.mock.calls[0][0],
    );
  });

  it('키체인 접근이 실패하면 ID 없이 넘어가고 경고를 보고한다', () => {
    // Given 키체인 읽기가 예외를 던진다
    const failure = new Error('keychain');
    mockStore.getItem.mockImplementation(() => {
      throw failure;
    });

    // When 기기 ID를 읽으면
    const id = getDeviceId();

    // Then undefined를 돌려주고 경고로 남긴다
    expect(id).toBeUndefined();
    expect(reportWarning).toHaveBeenCalledWith(failure, expect.anything());
  });
});

describe('getDeviceId — Android', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('ANDROID_ID를 돌려주고 키체인은 쓰지 않는다', () => {
    jest.spyOn(Application, 'getAndroidId').mockReturnValue('android-id');

    expect(getDeviceId()).toBe('android-id');
    expect(mockStore.getItem).not.toHaveBeenCalled();
  });

  it('ANDROID_ID가 비어 있으면 undefined를 돌려준다', () => {
    jest.spyOn(Application, 'getAndroidId').mockReturnValue('');

    expect(getDeviceId()).toBeUndefined();
  });
});
