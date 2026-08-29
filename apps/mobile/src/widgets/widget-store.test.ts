// 위젯 스냅샷 저장소 검증 — 위젯이 낡거나 깨진 규격으로 그리지 않게 하는 계약
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadWidgetData, saveWidgetData } from './widget-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const dataOf = (over: object = {}) => ({
  streak: 5,
  todayDone: false,
  lastCompletedDate: '2026-08-24',
  todayCardTitle: '룸메이트와 첫인사',
  weeklyDone: [true, true, false, true, true, true, false],
  ...over,
});

beforeEach(() => void AsyncStorage.clear());

describe('widget-store', () => {
  it('저장한 스냅샷을 그대로 되돌린다 (round-trip)', async () => {
    const data = dataOf();
    await saveWidgetData(data);

    expect(await loadWidgetData()).toEqual(data);
  });

  it('저장된 것이 없으면 null을 돌려준다', async () => {
    expect(await loadWidgetData()).toBeNull();
  });

  it('깨진 저장값이면 null을 돌려준다 — 위젯이 낡은 규격으로 그리게 두지 않는다', async () => {
    await AsyncStorage.setItem('landit.widget.snapshot', 'not-json');
    expect(await loadWidgetData()).toBeNull();

    await AsyncStorage.setItem(
      'landit.widget.snapshot',
      JSON.stringify({ streak: 'five' }),
    );
    expect(await loadWidgetData()).toBeNull();
  });
});
