// useGreetingCoach — 첫 안내 다음에 딱 한 번, 캐릭터를 눌러 인사를 들을 때까지 코치마크를 띄운다
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { introGuideSeen } from './intro-guide-seen';
import { tapGreetingSeen } from './tap-greeting-seen';
import { useGreetingCoach } from './useGreetingCoach';

afterEach(() => localStorage.clear());

const tabKey = () =>
  ({ key: 'Tab', preventDefault: vi.fn() }) as unknown as React.KeyboardEvent;

describe('useGreetingCoach', () => {
  it('처음 온 기기면 안내가 먼저고, 안내를 닫으면 코치마크가 켜진다', () => {
    const { result } = renderHook(() => useGreetingCoach({ onTap: vi.fn() }));

    expect(result.current.guideOpen).toBe(true);
    expect(result.current.coaching).toBe(false);

    act(() => result.current.closeGuide());

    expect(result.current.guideOpen).toBe(false);
    expect(result.current.coaching).toBe(true);
    expect(introGuideSeen.has()).toBe(true);
  });

  it('안내는 봤지만 아직 안 눌러 본 기기면 들어오자마자 코치마크가 켜진다', () => {
    introGuideSeen.mark();

    const { result } = renderHook(() => useGreetingCoach({ onTap: vi.fn() }));

    expect(result.current.coaching).toBe(true);
  });

  it('코치마크 중에 캐릭터를 누르면 인사가 시작되고 코치마크는 끝나며 기기에 기억한다', () => {
    introGuideSeen.mark();
    const onTap = vi.fn();
    const { result } = renderHook(() => useGreetingCoach({ onTap }));

    act(() => result.current.tapPartner());

    expect(onTap).toHaveBeenCalledOnce();
    expect(result.current.coaching).toBe(false);
    expect(tapGreetingSeen.has()).toBe(true);
  });

  it('둘 다 본 기기면 코치마크 없이 캐릭터만 누르면 인사한다', () => {
    introGuideSeen.mark();
    tapGreetingSeen.mark();
    const onTap = vi.fn();
    const { result } = renderHook(() => useGreetingCoach({ onTap }));

    act(() => result.current.tapPartner());

    expect(result.current.coaching).toBe(false);
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('안내가 떠 있는 동안 캐릭터가 눌려도 코치마크를 소모하지 않는다', () => {
    const { result } = renderHook(() => useGreetingCoach({ onTap: vi.fn() }));

    act(() => result.current.tapPartner());
    act(() => result.current.closeGuide());

    expect(result.current.coaching).toBe(true);
    expect(tapGreetingSeen.has()).toBe(false);
  });

  it('코치마크 중에는 Tab으로 캐릭터 밖으로 못 나가고, 끝나면 풀린다', () => {
    introGuideSeen.mark();
    const { result } = renderHook(() => useGreetingCoach({ onTap: vi.fn() }));

    const trapped = tabKey();
    result.current.trapFocus(trapped);
    act(() => result.current.tapPartner());
    const released = tabKey();
    result.current.trapFocus(released);

    expect(trapped.preventDefault).toHaveBeenCalled();
    expect(released.preventDefault).not.toHaveBeenCalled();
  });
});
