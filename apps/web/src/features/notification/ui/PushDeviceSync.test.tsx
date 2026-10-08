// PushDeviceSync — 로그인 계정·OS 권한·셸 토큰이 갖춰지거나 바뀔 때마다 설치 상태를 다시 보내는 계약 검증
import type { NativeToWebMessage } from '@landit/bridge';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/shared/auth/auth-store';

import { updatePushDevice } from '../api/push-device';
import { PushDeviceSync } from './PushDeviceSync';

const mocks = vi.hoisted(() => ({
  listeners: [] as ((message: NativeToWebMessage) => void)[],
}));

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
  subscribeFromNative: (listener: (message: NativeToWebMessage) => void) => {
    mocks.listeners.push(listener);
    return () => {
      mocks.listeners = mocks.listeners.filter((l) => l !== listener);
    };
  },
}));

vi.mock('@/shared/bridge/native-context', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getNativeContext: () => ({
    platform: 'ios',
    appVersion: '1.3.2',
    buildNumber: '11',
    bridgeVersion: 6,
  }),
}));

vi.mock('../api/push-device', () => ({
  updatePushDevice: vi.fn(() => Promise.resolve(null)),
}));
const updatePushDeviceMock = vi.mocked(updatePushDevice);

const TOKEN = 'ExponentPushToken[abc]';

const fromNative = (message: NativeToWebMessage) =>
  act(() => mocks.listeners.forEach((listener) => listener(message)));

const signIn = (userId: number) =>
  act(() =>
    useAuthStore.getState().setAuth('access', 'refresh', { userId } as never),
  );

beforeEach(() => {
  render(<PushDeviceSync />);
});

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearAuth();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('PushDeviceSync', () => {
  it('로그인 상태에서 권한 허용과 토큰이 오면 설치를 활성으로 등록한다', () => {
    signIn(1);

    fromNative({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });
    fromNative({ type: 'PUSH_TOKEN', token: TOKEN });

    expect(updatePushDeviceMock).toHaveBeenLastCalledWith(expect.any(String), {
      platform: 'IOS',
      expoPushToken: TOKEN,
      pushEnabled: true,
    });
  });

  it('로그인 전에는 권한과 토큰이 와도 보내지 않는다', () => {
    fromNative({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });
    fromNative({ type: 'PUSH_TOKEN', token: TOKEN });

    expect(updatePushDeviceMock).not.toHaveBeenCalled();
  });

  it('같은 설치에서 계정이 바뀌면 새 계정으로 다시 등록한다', () => {
    signIn(1);
    fromNative({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });
    fromNative({ type: 'PUSH_TOKEN', token: TOKEN });
    const [firstInstallation] = updatePushDeviceMock.mock.lastCall!;
    updatePushDeviceMock.mockClear();

    signIn(2);

    expect(updatePushDeviceMock).toHaveBeenCalledTimes(1);
    expect(updatePushDeviceMock.mock.lastCall![0]).toBe(firstInstallation);
  });

  it('OS 설정에서 권한을 끄고 돌아오면 설치를 비활성으로 보낸다', () => {
    signIn(1);
    fromNative({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });
    fromNative({ type: 'PUSH_TOKEN', token: TOKEN });

    fromNative({ type: 'NOTIFICATION_PERMISSION', status: 'denied' });

    expect(updatePushDeviceMock).toHaveBeenLastCalledWith(expect.any(String), {
      platform: 'IOS',
      pushEnabled: false,
    });
  });
});
