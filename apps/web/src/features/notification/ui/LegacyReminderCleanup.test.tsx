// LegacyReminderCleanup — 시작 시 구 셸에 예약 전체 해제 신호를 한 번 보내는 계약 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { postToNative } from '@/shared/bridge/web-bridge';

import { LegacyReminderCleanup } from './LegacyReminderCleanup';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
}));
const postToNativeMock = vi.mocked(postToNative);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LegacyReminderCleanup', () => {
  it('마운트되면 빈 예약 목록으로 전체 해제 신호를 한 번 보낸다', () => {
    render(<LegacyReminderCleanup />);

    expect(postToNativeMock).toHaveBeenCalledTimes(1);
    expect(postToNativeMock).toHaveBeenCalledWith({
      type: 'SYNC_REMINDERS',
      reminders: [],
    });
  });
});
