// 진동 설정 — 기본 켬, 끈 것만 기기에 남고, 바뀌면 구독자에게 알린다
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isHapticsEnabled,
  setHapticsEnabled,
  subscribeHapticsSetting,
} from './haptics-setting';

beforeEach(() => localStorage.clear());

describe('haptics setting', () => {
  it('아무것도 저장돼 있지 않으면 켬이다', () => {
    expect(isHapticsEnabled()).toBe(true);
  });

  it('끄면 저장되고 켜면 지워진다 — 켠 상태는 기본값이라 남길 게 없다', () => {
    setHapticsEnabled(false);
    expect(isHapticsEnabled()).toBe(false);
    expect(localStorage.getItem('landit-haptics-off')).toBe('1');

    setHapticsEnabled(true);
    expect(isHapticsEnabled()).toBe(true);
    expect(localStorage.getItem('landit-haptics-off')).toBeNull();
  });

  it('저장소를 못 읽으면 켠 것으로 본다 — 비공개 모드에서도 진동은 기본대로 울린다', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    try {
      expect(isHapticsEnabled()).toBe(true);
    } finally {
      getItem.mockRestore();
    }
  });

  it('바뀔 때마다 구독자에게 알리고, 구독을 풀면 더는 부르지 않는다', () => {
    const onChange = vi.fn();
    const unsubscribe = subscribeHapticsSetting(onChange);

    setHapticsEnabled(false);
    expect(onChange).toHaveBeenCalledTimes(1);

    unsubscribe();
    setHapticsEnabled(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
