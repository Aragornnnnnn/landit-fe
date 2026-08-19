// requestNotificationPermission — OS 권한창 회신 중 확정(허용/거부)만 한 번 계측하는지 검증
import { describe, expect, it, vi } from 'vitest';

import { track } from '@/shared/analytics';
import { postToNative } from '@/shared/bridge/web-bridge';

import { requestNotificationPermission } from './request-permission';

vi.mock('@/shared/analytics', () => ({ track: vi.fn() }));

const mocks = vi.hoisted(() => ({
  listeners: [] as Array<(message: unknown) => void>,
}));
vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
  subscribeFromNative: vi.fn((listener: (message: unknown) => void) => {
    mocks.listeners.push(listener);
    return () => {
      mocks.listeners = mocks.listeners.filter((l) => l !== listener);
    };
  }),
}));

const reply = (status: string) =>
  mocks.listeners.forEach((l) =>
    l({ type: 'NOTIFICATION_PERMISSION', status }),
  );

describe('requestNotificationPermission', () => {
  it('요청을 보내고, 허용 회신이 오면 granted로 한 번 찍는다', () => {
    requestNotificationPermission('scenario');

    reply('granted');

    expect(postToNative).toHaveBeenCalledWith({
      type: 'REQUEST_NOTIFICATION_PERMISSION',
    });
    expect(track).toHaveBeenCalledWith('Notification Permission Decided', {
      granted: true,
      source: 'scenario',
    });
    expect(mocks.listeners).toHaveLength(0);
  });

  it('아직 답하기 전 조회 회신(undetermined)은 건너뛰고 확정 회신만 찍는다', () => {
    requestNotificationPermission('onboarding');

    reply('undetermined');
    reply('denied');
    reply('denied');

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('Notification Permission Decided', {
      granted: false,
      source: 'onboarding',
    });
  });
});
