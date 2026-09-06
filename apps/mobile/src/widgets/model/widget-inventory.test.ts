// iOS 위젯 설치·삭제 감지 — 목록 차이를 추가·삭제로 풀고, 기준 목록을 갱신하는 계약
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getInstalledWidgetFamilies } from '../../../modules/widget-inventory';
import { drainWidgetChanges } from './widget-changes';
import { diffWidgetInventory, syncWidgetInventory } from './widget-inventory';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../../modules/widget-inventory', () => ({
  getInstalledWidgetFamilies: jest.fn(),
}));
const inventoryMock = jest.mocked(getInstalledWidgetFamilies);

beforeEach(() => {
  void AsyncStorage.clear();
  Platform.OS = 'ios';
});

describe('diffWidgetInventory', () => {
  it('늘어난 크기는 added, 줄어든 크기는 removed로 개수만큼 낸다', () => {
    expect(
      diffWidgetInventory(['small', 'large'], ['small', 'small', 'medium']),
    ).toEqual([
      { change: 'added', family: 'small' },
      { change: 'added', family: 'medium' },
      { change: 'removed', family: 'large' },
    ]);
  });

  it('같으면 아무것도 내지 않는다', () => {
    expect(diffWidgetInventory(['medium'], ['medium'])).toEqual([]);
  });
});

describe('syncWidgetInventory', () => {
  it('처음엔 놓인 위젯 전부를 추가로 기록하고, 다음엔 달라진 것만 기록한다', async () => {
    inventoryMock.mockResolvedValueOnce(['small', 'other']);
    await syncWidgetInventory();
    await expect(drainWidgetChanges()).resolves.toEqual([
      { change: 'added', family: 'small' },
    ]);

    inventoryMock.mockResolvedValueOnce(['small', 'large']);
    await syncWidgetInventory();
    await expect(drainWidgetChanges()).resolves.toEqual([
      { change: 'added', family: 'large' },
    ]);

    inventoryMock.mockResolvedValueOnce(['large']);
    await syncWidgetInventory();
    await expect(drainWidgetChanges()).resolves.toEqual([
      { change: 'removed', family: 'small' },
    ]);
  });

  it('조회에 실패하면 기록도 기준도 건드리지 않는다', async () => {
    inventoryMock.mockRejectedValueOnce(new Error('unavailable'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await syncWidgetInventory();

    await expect(drainWidgetChanges()).resolves.toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('안드로이드에선 조회하지 않는다 — 프로바이더 콜백이 담당한다', async () => {
    Platform.OS = 'android';

    await syncWidgetInventory();

    expect(inventoryMock).not.toHaveBeenCalled();
  });
});
