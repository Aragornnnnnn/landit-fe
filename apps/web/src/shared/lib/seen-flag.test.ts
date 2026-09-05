// seenFlag — "이 기기에서 본 적 있는가"를 localStorage 한 키로 기록하는 계약. 저장소가 없으면 안 본 것으로 친다
import { afterEach, describe, expect, it, vi } from 'vitest';

import { seenFlag } from './seen-flag';

const KEY = 'landit-test-seen';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('seenFlag', () => {
  it('아직 기록이 없으면 안 본 것이다', () => {
    const flag = seenFlag(KEY);

    expect(flag.has()).toBe(false);
  });

  it('본 것으로 기록하면 그 뒤로는 봤다고 답한다', () => {
    const flag = seenFlag(KEY);

    flag.mark();

    expect(flag.has()).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('1');
  });

  it('저장소를 못 읽으면 안 본 것으로 물러선다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const flag = seenFlag(KEY);

    expect(flag.has()).toBe(false);
  });

  it('저장소에 못 쓰면 던지지 않고 넘어간다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const flag = seenFlag(KEY);

    expect(() => flag.mark()).not.toThrow();
  });

  it('본 것으로 기록하면 지켜보던 쪽에 알린다', () => {
    // Given 한 화면이 이 플래그를 지켜보는 상태에서
    const flag = seenFlag(KEY);
    const onChange = vi.fn();
    flag.subscribe(onChange);

    // When 다른 화면이 본 것으로 기록하면
    flag.mark();

    // Then 지켜보던 쪽이 바뀐 걸 안다
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('구독을 끊은 뒤에는 알리지 않는다', () => {
    // Given 지켜보다 그만둔 화면이 있을 때
    const flag = seenFlag(KEY);
    const onChange = vi.fn();
    flag.subscribe(onChange)();

    // When 본 것으로 기록해도
    flag.mark();

    // Then 떠난 쪽에는 알리지 않는다
    expect(onChange).not.toHaveBeenCalled();
  });
});
