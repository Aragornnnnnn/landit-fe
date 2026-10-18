// iOS 알람 설정 안내 시트 계측 — 설정 앱으로 나갔다고 찍는지
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IosAlarmSettingsSheet } from './IosAlarmSettingsSheet';

const mocks = vi.hoisted(() => ({ track: vi.fn(), post: vi.fn() }));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('@/shared/bridge/web-bridge', () => ({ postToNative: mocks.post }));
vi.mock('next/image', () => ({ default: () => <span /> }));
// 시트의 열고 닫는 연출은 보지 않는다
vi.mock('@/shared/ui/BottomSheet', () => ({
  BottomSheet: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div>{children}</div> : null,
    { Title: (props: React.ComponentProps<'h2'>) => <h2 {...props} /> },
  ),
}));

afterEach(cleanup);

describe('IosAlarmSettingsSheet 계측', () => {
  it('설정을 열면 앱 설정으로 나갔다고 찍는다', () => {
    render(<IosAlarmSettingsSheet open onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: '설정 열기' }));

    expect(mocks.track.mock.calls).toEqual([
      ['Alarm Settings Opened', { target: 'app' }],
    ]);
  });
});
