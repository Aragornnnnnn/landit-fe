// deviceSetting — 기기 하나에만 남는 설정값의 읽기·쓰기·변경 알림 계약
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { deviceSetting } from './device-setting';

const KEY = 'landit-test-setting';
const makeSetting = () =>
  deviceSetting<number>({
    key: KEY,
    defaultValue: 1,
    parse: (saved) => {
      const value = Number(saved);
      return Number.isNaN(value) ? undefined : value;
    },
  });

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('deviceSetting', () => {
  it('저장값이 없으면 기본값을 준다', () => {
    expect(makeSetting().get()).toBe(1);
  });

  it('기본값과 다른 값은 기기에 남는다', () => {
    const setting = makeSetting();

    setting.set(2);

    expect(localStorage.getItem(KEY)).toBe('2');
  });

  it('기본값으로 되돌리면 저장값을 지운다', () => {
    const setting = makeSetting();
    setting.set(2);

    setting.set(1);

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('읽을 수 없는 저장값이면 기본값을 준다', () => {
    localStorage.setItem(KEY, 'abc');

    expect(makeSetting().get()).toBe(1);
  });

  it('저장소를 못 쓰면 기본값을 준다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(makeSetting().get()).toBe(1);
  });

  it('값을 바꾸면 구독자에게 알린다', () => {
    const setting = makeSetting();
    const onChange = vi.fn();
    setting.subscribe(onChange);

    setting.set(2);

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
