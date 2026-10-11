// 알람 권한 배너 계측 — 막혔을 때만 노출을 찍고, 「지금 켜기」가 어느 권한에서 눌렸는지 싣는지
import type { AlarmStatus } from '@landit/bridge';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AlarmBlocker } from '../model/alarm-permission';
import { AlarmPermissionBanner } from './AlarmPermissionBanner';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  unblock: vi.fn(),
  blocker: null as AlarmBlocker | null,
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('../model/useAlarmUnblock', () => ({
  useAlarmUnblock: () => ({
    blocker: mocks.blocker,
    unblock: mocks.unblock,
    sheet: null,
    closeSheet: () => {},
  }),
}));
vi.mock('./AlarmUnblockSheets', () => ({ AlarmUnblockSheets: () => null }));

const STATUS = { supported: true } as AlarmStatus;

beforeEach(() => {
  mocks.blocker = null;
});
afterEach(cleanup);

describe('AlarmPermissionBanner 계측', () => {
  it('막힌 권한이 있으면 배너 노출을 그 권한과 함께 한 번 찍는다', () => {
    mocks.blocker = 'ios-settings';

    const { rerender } = render(<AlarmPermissionBanner status={STATUS} />);
    rerender(<AlarmPermissionBanner status={STATUS} />);

    expect(mocks.track.mock.calls).toEqual([
      ['Alarm Permission Banner Viewed', { blocker: 'ios_settings' }],
    ]);
  });

  it('막힌 권한이 다른 것으로 바뀌면 다시 찍는다', () => {
    mocks.blocker = 'android-notifications';
    const { rerender } = render(<AlarmPermissionBanner status={STATUS} />);

    mocks.blocker = 'android-settings';
    rerender(<AlarmPermissionBanner status={STATUS} />);

    expect(mocks.track.mock.calls.at(-1)).toEqual([
      'Alarm Permission Banner Viewed',
      { blocker: 'android_settings' },
    ]);
  });

  it('막힌 게 없으면 아무것도 찍지 않는다', () => {
    render(<AlarmPermissionBanner status={STATUS} />);

    expect(mocks.track).not.toHaveBeenCalled();
  });

  it('「지금 켜기」를 누르면 배너에서 풀러 갔다고 찍고 권한을 풀러 간다', () => {
    mocks.blocker = 'android-notifications';
    render(<AlarmPermissionBanner status={STATUS} />);
    mocks.track.mockClear();

    fireEvent.click(screen.getByRole('button', { name: '지금 켜기' }));

    expect(mocks.track.mock.calls).toEqual([
      [
        'Alarm Unblock Tapped',
        { blocker: 'android_notifications', source: 'banner' },
      ],
    ]);
    expect(mocks.unblock).toHaveBeenCalledTimes(1);
  });
});
