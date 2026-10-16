// 알람 수정 화면 계측 — 시각을 바꿔 저장했을 때와 지웠을 때만 찍는지
import { useImperativeHandle } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AlarmEditScreen } from './AlarmEditScreen';

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  saved: [] as unknown[],
  picked: { hour: 7, minute: 30 },
}));
vi.mock('@/shared/analytics', () => ({ track: mocks.track }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }),
}));
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('@/features/alarm/model/shell-alarm', () => ({
  isAlarmShell: () => true,
}));
vi.mock('@/features/alarm/model/useAlarmSettingQuery', () => ({
  useAlarmSettingQuery: () => ({
    data: { time: '19:00', enabled: true },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
// 저장은 바로 성공한다
vi.mock('@/features/alarm/model/useSaveAlarmMutation', () => ({
  useSaveAlarmMutation: () => ({
    isPending: false,
    mutate: (input: unknown, options: { onSuccess: () => void }) => {
      mocks.saved.push(input);
      options.onSuccess();
    },
  }),
}));
vi.mock('@/features/alarm/ui/LockScreenPreview', () => ({
  LockScreenPreview: () => null,
}));
// 휠은 돌리지 않는다 — 「확인」을 누르면 정해 둔 시각을 읽어 간다
vi.mock('@/features/alarm/ui/TimeWheel', () => ({
  TimeWheel: ({ ref }: { ref: React.Ref<{ read: () => unknown }> }) => {
    useImperativeHandle(ref, () => ({ read: () => mocks.picked }));
    return null;
  },
}));
vi.mock('@/shared/ui/BottomSheet', () => ({
  BottomSheet: Object.assign(
    ({ open, children }: { open: boolean; children: React.ReactNode }) =>
      open ? <div>{children}</div> : null,
    { Title: (props: React.ComponentProps<'h2'>) => <h2 {...props} /> },
  ),
}));

const pickTime = (time: { hour: number; minute: number }) => {
  mocks.picked = time;
  fireEvent.click(screen.getByRole('button', { name: /시각/ }));
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
};
const save = () =>
  fireEvent.click(screen.getByRole('button', { name: '저장하기' }));

beforeEach(() => {
  mocks.saved = [];
});
afterEach(cleanup);

describe('AlarmEditScreen 계측', () => {
  it('시각을 바꿔 저장하면 바꾼 시각과 함께 찍는다', () => {
    render(<AlarmEditScreen />);

    pickTime({ hour: 7, minute: 30 });
    save();

    expect(mocks.track.mock.calls).toEqual([
      ['Alarm Time Changed', { time: '07:30' }],
    ]);
  });

  it('시각을 안 바꾸고 저장하면 저장도 계측도 하지 않는다', () => {
    render(<AlarmEditScreen />);

    save();

    expect(mocks.saved).toEqual([]);
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it('알람을 지우면 지웠다고 찍는다', () => {
    render(<AlarmEditScreen />);

    fireEvent.click(screen.getByRole('button', { name: '알람 삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    expect(mocks.track.mock.calls).toEqual([
      ['Confirm Sheet Opened', { sheet: 'alarm_delete' }],
      ['Alarm Removed'],
    ]);
  });

  it('삭제를 물었을 때 취소하면 닫았다고만 찍고 지우지 않는다', () => {
    render(<AlarmEditScreen />);
    fireEvent.click(screen.getByRole('button', { name: '알람 삭제' }));

    fireEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(mocks.track.mock.calls.at(-1)).toEqual([
      'Confirm Sheet Dismissed',
      { sheet: 'alarm_delete' },
    ]);
    expect(mocks.saved).toEqual([]);
  });
});
