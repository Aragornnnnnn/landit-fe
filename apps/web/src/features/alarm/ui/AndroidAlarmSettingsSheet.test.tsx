// Android 알람 설정 안내 시트 계측 — 켤 것마다 어느 OS 설정으로 나갔는지 싣는지
import type { AlarmStatus } from '@landit/bridge';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AndroidAlarmSettingsSheet } from './AndroidAlarmSettingsSheet';

const mocks = vi.hoisted(() => ({ track: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/shared/bridge/web-bridge', () => ({ postToNative: mocks.post }));
vi.mock('next/image', () => ({ default: () => <span /> }));
// 시트의 열고 닫는 연출은 보지 않는다
vi.mock('@/shared/ui/BottomSheet', () => ({
  BottomSheet: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
}));

afterEach(cleanup);

const status = (patch: Partial<AlarmStatus>) =>
  ({
    supported: true,
    exactAlarm: true,
    fullScreen: true,
    ...patch,
  }) as AlarmStatus;

describe('AndroidAlarmSettingsSheet 계측', () => {
  it.each([
    [
      '정확한 알람이 꺼져 있으면',
      { exactAlarm: false },
      '알람 및 리마인더 켜기',
      'exact_alarm',
    ],
    [
      '전체 화면 알림만 꺼져 있으면',
      { fullScreen: false },
      '전체 화면 알림 켜기',
      'full_screen',
    ],
  ])('%s 그 설정으로 나갔다고 찍는다', (_case, patch, button, target) => {
    render(
      <AndroidAlarmSettingsSheet
        open
        status={status(patch)}
        onClose={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: button }));

    expect(mocks.track.mock.calls).toEqual([
      ['Alarm Settings Opened', { target }],
    ]);
  });

  it('다 켠 뒤의 버튼은 닫기일 뿐이라 찍지 않는다', () => {
    const onClose = vi.fn();
    render(
      <AndroidAlarmSettingsSheet open status={status({})} onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '다 켰어요' }));

    expect(mocks.track).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
