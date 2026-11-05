// 화면별 뒤로가기 등록 — 맨 나중에 등록한 화면 하나만 뒤로가기를 받는지 검증
import { describe, expect, it, vi } from 'vitest';

import { registerBackPress, runBackPress } from './back-press';

describe('back-press', () => {
  it('등록한 화면이 없으면 뒤로가기를 처리하지 않는다', () => {
    expect(runBackPress()).toBe(false);
  });

  it('맨 나중에 등록한 화면 하나만 뒤로가기를 받는다', () => {
    // Given 두 화면이 등록돼 있다
    const lower = vi.fn();
    const upper = vi.fn();
    const unregisterLower = registerBackPress(lower);
    const unregisterUpper = registerBackPress(upper);

    // When 뒤로가기를 누르면
    const handled = runBackPress();

    // Then 위의 화면만 받는다
    expect(handled).toBe(true);
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();
    unregisterUpper();
    unregisterLower();
  });

  it('등록을 풀면 아래 화면이 다시 뒤로가기를 받는다', () => {
    // Given 위의 화면이 사라졌다
    const lower = vi.fn();
    const unregisterLower = registerBackPress(lower);
    registerBackPress(vi.fn())();

    // When 뒤로가기를 누르면
    runBackPress();

    // Then 아래 화면이 받는다
    expect(lower).toHaveBeenCalledTimes(1);
    unregisterLower();
  });
});
