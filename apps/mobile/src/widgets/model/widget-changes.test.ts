// 위젯 추가·삭제 기록 — 쌓기·비우기·즉시 알림 계약. 레코드마다 키를 따로 둬 쌓기와 비우기가 서로 지우지 않는다
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

    const drained = await drainWidgetChanges();

    expect(drained).toEqual([
      { change: 'added', family: 'small' },
      { change: 'removed', family: 'large' },
    ]);
    await expect(drainWidgetChanges()).resolves.toEqual([]);
  });

  it('비우는 사이에 새로 쌓인 레코드는 지우지 않고 다음 비우기에 남긴다', async () => {
    await recordWidgetChange({ change: 'added', family: 'small' });
    // 비우기가 키를 읽은 직후(값을 읽는 동안) 다른 실행이 한 건을 더 쌓는다
    const originalMultiGet = AsyncStorage.multiGet;
    jest
      .spyOn(AsyncStorage, 'multiGet')
      .mockImplementationOnce(async (keys) => {
        await recordWidgetChange({ change: 'added', family: 'medium' });
        return originalMultiGet(keys);
      });

    const first = await drainWidgetChanges();
    const second = await drainWidgetChanges();

    expect(first).toEqual([{ change: 'added', family: 'small' }]);
    expect(second).toEqual([{ change: 'added', family: 'medium' }]);
  });

  it('비우기가 겹치면 한 번만 읽어 같은 레코드를 두 번 내지 않는다', async () => {
    await recordWidgetChange({ change: 'removed', family: 'small' });

    const [a, b] = await Promise.all([
      drainWidgetChanges(),
      drainWidgetChanges(),
    ]);

    expect(a).toEqual([{ change: 'removed', family: 'small' }]);
    expect(b).toBe(a);
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

  it('규격 밖이거나 깨진 레코드는 버리고 멀쩡한 것만 낸다', async () => {
    await AsyncStorage.setItem(
      'landit.widget.change.0000000000001-a',
      'not-json',
    );
    await AsyncStorage.setItem(
      'landit.widget.change.0000000000002-b',
      JSON.stringify({ change: 'resized', family: 'small' }),
    );
    await recordWidgetChange({ change: 'added', family: 'large' });

    await expect(drainWidgetChanges()).resolves.toEqual([
      { change: 'added', family: 'large' },
    ]);
  });
});
