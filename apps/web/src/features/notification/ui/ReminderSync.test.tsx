// ReminderSync — 권한이 허용된 순간에만 예약 목록을 셸로 보내는 갈림길 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { REMINDER_DAYS } from '../model/reminders';
import { useNotificationPermission } from '../model/useNotificationPermission';
import { ReminderSync } from './ReminderSync';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
}));
const postToNativeMock = vi.mocked(postToNative);

vi.mock('../model/useNotificationPermission');
const useNotificationPermissionMock = vi.mocked(useNotificationPermission);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReminderSync', () => {
  it('권한이 허용 상태면 전체 예약 목록을 셸로 보낸다', () => {
    useNotificationPermissionMock.mockReturnValue('granted');

    render(<ReminderSync />);

    expect(postToNativeMock).toHaveBeenCalledTimes(1);
    const message = postToNativeMock.mock.calls[0][0];
    expect(message.type).toBe('SYNC_REMINDERS');
    if (message.type === 'SYNC_REMINDERS') {
      expect(message.reminders).toHaveLength(REMINDER_DAYS);
    }
  });

  it.each([['undetermined'], ['denied'], ['unavailable']] as const)(
    '권한이 허용이 아니면(%s) 아무것도 보내지 않는다',
    (permission) => {
      useNotificationPermissionMock.mockReturnValue(permission);

      render(<ReminderSync />);

      expect(postToNativeMock).not.toHaveBeenCalled();
    },
  );
});
