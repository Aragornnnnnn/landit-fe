// 푸시 토큰 발급의 갈림길 — 실패하면 null로 넘기고 warning으로 보고하며, 다음 호출에서 다시 시도한다
import * as Notifications from 'expo-notifications';

import { reportWarning } from '../monitoring/report';
import { getExpoPushToken } from './push-token';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-id' } } } },
}));
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(),
}));
jest.mock('../monitoring/report', () => ({ reportWarning: jest.fn() }));

const tokenMock = jest.mocked(Notifications.getExpoPushTokenAsync);

describe('getExpoPushToken', () => {
  it('발급이 실패하면 null을 돌려주고 warning으로 보고한다 — 웹 등록을 건너뛰고 다음 실행에 다시 받는다', async () => {
    const error = new Error('Expo push service unavailable');
    tokenMock.mockRejectedValueOnce(error);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(getExpoPushToken()).resolves.toBeNull();

    expect(reportWarning).toHaveBeenCalledWith(error);
  });

  it('실패 뒤 다시 부르면 발급을 다시 시도한다', async () => {
    tokenMock.mockResolvedValueOnce({
      data: 'ExponentPushToken[abc]',
    } as never);

    await expect(getExpoPushToken()).resolves.toBe('ExponentPushToken[abc]');
  });
});
