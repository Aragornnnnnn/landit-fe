// 셸 알람 상태 훅 — Android에서 알림 권한이 실제로 바뀔 때만 알람 상태를 다시 묻는지 검증
import type { NativeToWebMessage } from '@landit/bridge';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  postToNative: vi.fn<(message: unknown) => boolean>(() => true),
  listeners: [] as ((message: NativeToWebMessage) => void)[],
  platform: 'android' as 'ios' | 'android',
}));

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: mocks.postToNative,
  subscribeFromNative: (listener: (message: NativeToWebMessage) => void) => {
    mocks.listeners.push(listener);
    return () => {};
  },
}));

vi.mock('./shell-alarm', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isAlarmShell: () => true,
  alarmPlatform: () => mocks.platform,
}));

const broadcast = (message: NativeToWebMessage) =>
  act(() => mocks.listeners.forEach((listener) => listener(message)));

const alarmStatusRequests = () =>
  mocks.postToNative.mock.calls.filter(
    ([message]) => (message as { type: string }).type === 'GET_ALARM_STATUS',
  ).length;

beforeEach(async () => {
  mocks.listeners = [];
  mocks.platform = 'android';
  vi.resetModules();
});

const mountTwice = async () => {
  const { useAlarmStatus } = await import('./useAlarmStatus');
  renderHook(() => useAlarmStatus());
  renderHook(() => useAlarmStatus());
  mocks.postToNative.mockClear();
};

describe('useAlarmStatus', () => {
  it('Android에서 알림 권한이 바뀌면 훅이 여럿이어도 알람 상태를 한 번만 다시 묻는다', async () => {
    await mountTwice();
    broadcast({ type: 'NOTIFICATION_PERMISSION', status: 'undetermined' });
    mocks.postToNative.mockClear();

    broadcast({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });

    expect(alarmStatusRequests()).toBe(1);
  });

  it('같은 알림 권한이 다시 오면 묻지 않는다', async () => {
    await mountTwice();
    broadcast({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });
    mocks.postToNative.mockClear();

    broadcast({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });

    expect(alarmStatusRequests()).toBe(0);
  });

  it('iOS는 알림 권한이 알람과 무관해 다시 묻지 않는다', async () => {
    mocks.platform = 'ios';
    await mountTwice();
    broadcast({ type: 'NOTIFICATION_PERMISSION', status: 'undetermined' });

    broadcast({ type: 'NOTIFICATION_PERMISSION', status: 'granted' });

    expect(alarmStatusRequests()).toBe(0);
  });
});
