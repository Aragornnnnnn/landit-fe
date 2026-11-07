// 녹음하는 동안 진동을 막는 훅 — 겹쳐 막아도 한 번만 막고, 풀기·화면 떠남에 꼭 풀리는지 검증
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { muteHaptics } from './haptics';
import { useHapticsMute } from './useHapticsMute';

const unmute = vi.hoisted(() => vi.fn());
vi.mock('./haptics', () => ({ muteHaptics: vi.fn(() => unmute) }));

describe('useHapticsMute', () => {
  it('막으면 진동을 막고, 풀면 푼다', () => {
    const { result } = renderHook(() => useHapticsMute());

    act(() => result.current.mute());
    expect(muteHaptics).toHaveBeenCalledTimes(1);

    act(() => result.current.unmute());
    expect(unmute).toHaveBeenCalledTimes(1);
  });

  it('이미 막아 둔 채로 또 막아도 한 번만 막는다 — 한 번 풀면 다시 울려야 한다', () => {
    const { result } = renderHook(() => useHapticsMute());

    act(() => {
      result.current.mute();
      result.current.mute();
    });

    expect(muteHaptics).toHaveBeenCalledTimes(1);
  });

  it('막지 않은 채 풀어도 아무 일도 없다', () => {
    const { result } = renderHook(() => useHapticsMute());

    act(() => result.current.unmute());

    expect(unmute).not.toHaveBeenCalled();
  });

  it('막아 둔 채 화면을 떠나면 푼다 — 진동이 앱 전체에서 막힌 채 남지 않게', () => {
    const { result, unmount } = renderHook(() => useHapticsMute());
    act(() => result.current.mute());

    unmount();

    expect(unmute).toHaveBeenCalledTimes(1);
  });
});
