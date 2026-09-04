// 위젯 추가·삭제 기록 — 쌓기·비우기·즉시 알림 계약
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  drainWidgetChanges,
  recordWidgetChange,
  subscribeWidgetChanges,
} from './widget-changes';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => void AsyncStorage.clear());

describe('widget-changes', () => {
  it('기록한 순서대로 꺼내고, 꺼낸 뒤엔 비어 있다', async () => {
    await recordWidgetChange({ change: 'added', family: 'small' });
    await recordWidgetChange({ change: 'removed', family: 'large' });

    await expect(drainWidgetChanges()).resolves.toEqual([
      { change: 'added', family: 'small' },
      { change: 'removed', family: 'large' },
    ]);
    await expect(drainWidgetChanges()).resolves.toEqual([]);
  });

  it('기록될 때마다 구독자에게 알린다 — 해지하면 더는 안 부른다', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeWidgetChanges(listener);

    await recordWidgetChange({ change: 'added', family: 'medium' });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await recordWidgetChange({ change: 'added', family: 'medium' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('저장된 값이 깨져 있으면 빈 목록으로 본다', async () => {
    await AsyncStorage.setItem('landit.widget.changes', 'not-json');

    await expect(drainWidgetChanges()).resolves.toEqual([]);
  });
});
