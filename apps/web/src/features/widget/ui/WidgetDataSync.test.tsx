// WidgetDataSync — 데이터가 준비된 순간·바뀐 순간에만 위젯 스냅샷을 셸로 보내는 계약 검증
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDailyScenarioQuery } from '@/features/scenario/model/useDailyScenarioQuery';
import { useScenarioCalendarQuery } from '@/features/scenario/model/useScenarioCalendarQuery';
import { useStreakQuery } from '@/features/streak/model/useStreakQuery';
import { postToNative } from '@/shared/bridge/web-bridge';

import { WidgetDataSync } from './WidgetDataSync';

vi.mock('@/shared/bridge/web-bridge', () => ({
  postToNative: vi.fn(() => true),
}));
const postToNativeMock = vi.mocked(postToNative);

vi.mock('@/features/streak/model/useStreakQuery');
const useStreakQueryMock = vi.mocked(useStreakQuery);

vi.mock('@/features/scenario/model/useDailyScenarioQuery');
const useDailyScenarioQueryMock = vi.mocked(useDailyScenarioQuery);

vi.mock('@/features/scenario/model/useScenarioCalendarQuery');
const useScenarioCalendarQueryMock = vi.mocked(useScenarioCalendarQuery);

const streakOf = (over: object = {}) => ({
  streak: {
    currentStreakDays: 5,
    activeToday: false,
    today: '2026-08-25',
    ...over,
  },
  isPending: false,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const arrange = () => {
  useDailyScenarioQueryMock.mockReturnValue({
    daily: null,
    error: null,
    isLoading: false,
    retry: () => {},
  });
  useScenarioCalendarQueryMock.mockReturnValue({ calendar: null });
};

describe('WidgetDataSync', () => {
  it('스트릭 데이터가 준비되면 위젯 스냅샷을 셸로 보낸다', () => {
    arrange();
    useStreakQueryMock.mockReturnValue(streakOf());

    render(<WidgetDataSync />);

    expect(postToNativeMock).toHaveBeenCalledTimes(1);
    const message = postToNativeMock.mock.calls[0][0];
    expect(message.type).toBe('SYNC_WIDGET_DATA');
    if (message.type === 'SYNC_WIDGET_DATA') {
      expect(message.data.streak).toBe(5);
      expect(message.data.lastCompletedDate).toBe('2026-08-24');
      expect(message.data.weeklyDone).toHaveLength(7);
    }
  });

  it('스트릭을 아직 못 받았으면 아무것도 보내지 않는다', () => {
    arrange();
    useStreakQueryMock.mockReturnValue({ streak: null, isPending: true });

    render(<WidgetDataSync />);

    expect(postToNativeMock).not.toHaveBeenCalled();
  });

  it('같은 데이터로 리렌더돼도 다시 보내지 않는다', () => {
    arrange();
    useStreakQueryMock.mockReturnValue(streakOf());

    const { rerender } = render(<WidgetDataSync />);
    rerender(<WidgetDataSync />);

    expect(postToNativeMock).toHaveBeenCalledTimes(1);
  });

  it('대화 완료로 데이터가 바뀌면 새 스냅샷을 다시 보낸다', () => {
    arrange();
    useStreakQueryMock.mockReturnValue(streakOf());
    const { rerender } = render(<WidgetDataSync />);

    useStreakQueryMock.mockReturnValue(
      streakOf({ currentStreakDays: 6, activeToday: true }),
    );
    rerender(<WidgetDataSync />);

    expect(postToNativeMock).toHaveBeenCalledTimes(2);
    const message = postToNativeMock.mock.calls[1][0];
    if (message.type === 'SYNC_WIDGET_DATA') {
      expect(message.data.todayDone).toBe(true);
      expect(message.data.streak).toBe(6);
    }
  });
});
