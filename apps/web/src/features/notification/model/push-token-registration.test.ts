// push-token-registration — 플랫폼 변환과 등록·해제 계약 검증
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getNativeContext } from '@/shared/bridge/native-context';

import { updateExpoPushToken } from '../api/push-token';
import { disablePushToken, registerPushToken } from './push-token-registration';

vi.mock('@/shared/bridge/native-context', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getNativeContext: vi.fn(() => null),
}));
const getNativeContextMock = vi.mocked(getNativeContext);

vi.mock('../api/push-token', () => ({ updateExpoPushToken: vi.fn() }));
const updateExpoPushTokenMock = vi.mocked(updateExpoPushToken);

const nativeContext = (platform: 'ios' | 'android') => ({
  platform,
  appVersion: '1.1.0',
  buildNumber: '11',
  bridgeVersion: 2,
});

const TOKEN = 'ExponentPushToken[abc]';

afterEach(async () => {
  // 모듈이 마지막 토큰을 기억하므로 테스트마다 비운다
  getNativeContextMock.mockReturnValue(nativeContext('ios'));
  await disablePushToken();
  vi.clearAllMocks();
});

describe('registerPushToken', () => {
  it.each([
    ['ios', 'IOS'],
    ['android', 'ANDROID'],
  ] as const)('셸의 %s를 백엔드 표기 %s로 바꿔 보낸다', async (os, api) => {
    getNativeContextMock.mockReturnValue(nativeContext(os));

    await registerPushToken(TOKEN);

    expect(updateExpoPushTokenMock).toHaveBeenCalledWith({
      platform: api,
      expoPushToken: TOKEN,
      enabled: true,
    });
  });

  it('셸이 없으면(브라우저) 보내지 않는다 — 등록할 기기가 없다', async () => {
    getNativeContextMock.mockReturnValue(null);

    await registerPushToken(TOKEN);

    expect(updateExpoPushTokenMock).not.toHaveBeenCalled();
  });
});

describe('disablePushToken', () => {
  it('마지막으로 등록한 토큰을 enabled=false로 보낸다', async () => {
    getNativeContextMock.mockReturnValue(nativeContext('ios'));
    await registerPushToken(TOKEN);
    updateExpoPushTokenMock.mockClear();

    await disablePushToken();

    expect(updateExpoPushTokenMock).toHaveBeenCalledWith({
      platform: 'IOS',
      expoPushToken: TOKEN,
      enabled: false,
    });
  });

  it('등록한 적이 없으면 아무것도 하지 않는다', async () => {
    getNativeContextMock.mockReturnValue(nativeContext('ios'));

    await disablePushToken();

    expect(updateExpoPushTokenMock).not.toHaveBeenCalled();
  });
});
