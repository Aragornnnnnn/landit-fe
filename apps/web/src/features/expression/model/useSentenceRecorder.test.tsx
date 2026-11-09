// 녹음 배선 훅 검증 — StrictMode 이중 이펙트에도 세션이 살아남는지(재발 방지)와 기본 계약
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { muteHaptics } from '@/shared/haptics/haptics';

import { useSentenceRecorder } from './useSentenceRecorder';

const unmute = vi.hoisted(() => vi.fn());
vi.mock('@/shared/haptics/haptics', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/haptics/haptics')>()),
  muteHaptics: vi.fn(() => unmute),
}));

class FakeMediaRecorder {
  static isTypeSupported = () => true;

  state = 'recording';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  start() {}

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['chunk']) });
    this.onstop?.();
  }
}

beforeEach(() => {
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }],
      })),
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('useSentenceRecorder', () => {
  it('StrictMode 이중 이펙트 후에도 start→stop이 녹음을 돌려준다 — 마운트 직후 파기되던 버그 재현', async () => {
    // given — StrictMode는 dev에서 이펙트를 마운트→정리→재실행으로 한 바퀴 돌린다
    const { result } = renderHook(() => useSentenceRecorder(), {
      wrapper: StrictMode,
    });

    await act(() => result.current.start());
    const recording = await act(() => result.current.stop());

    expect(recording).not.toBeNull();
    expect(recording?.blob.size).toBeGreaterThan(0);
  });

  it('start 없이 stop하면 null이다', async () => {
    const { result } = renderHook(() => useSentenceRecorder());

    const recording = await act(() => result.current.stop());

    expect(recording).toBeNull();
  });

  it('권한 거부(NotAllowedError)는 MicPermissionDeniedError로 바꿔 던진다', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => {
          throw new DOMException('denied', 'NotAllowedError');
        }),
      },
    });
    const { result } = renderHook(() => useSentenceRecorder());

    await expect(act(() => result.current.start())).rejects.toMatchObject({
      name: 'MicPermissionDeniedError',
    });
  });

  describe('녹음하는 동안 진동 막기', () => {
    it('녹음이 시작되면 진동을 막고, 녹음을 확정하면 푼다', async () => {
      const { result } = renderHook(() => useSentenceRecorder());

      await act(() => result.current.start());
      expect(muteHaptics).toHaveBeenCalledTimes(1);
      expect(unmute).not.toHaveBeenCalled();

      await act(() => result.current.stop());
      expect(unmute).toHaveBeenCalledTimes(1);
    });

    it('녹음 확정이 실패해도 푼다 — 진동이 앱 전체에서 막힌 채 남지 않게', async () => {
      class BrokenRecorder extends FakeMediaRecorder {
        override stop() {
          throw new Error('장치가 분리됨');
        }
      }
      vi.stubGlobal('MediaRecorder', BrokenRecorder);
      const { result } = renderHook(() => useSentenceRecorder());
      await act(() => result.current.start());

      await act(() => result.current.stop().catch(() => null));

      expect(unmute).toHaveBeenCalledTimes(1);
    });

    it('확정을 기다리는 동안 다시 시작해도 새 녹음은 막힌 채로 둔다 — 이전 확정이 새 녹음의 막힘을 풀지 않게', async () => {
      let finishStop!: () => void;
      class SlowRecorder extends FakeMediaRecorder {
        override stop() {
          this.state = 'inactive';
          finishStop = () => {
            this.ondataavailable?.({ data: new Blob(['chunk']) });
            this.onstop?.();
          };
        }
      }
      vi.stubGlobal('MediaRecorder', SlowRecorder);
      const { result } = renderHook(() => useSentenceRecorder());
      await act(() => result.current.start());

      let stopping!: Promise<unknown>;
      act(() => {
        stopping = result.current.stop();
      });
      await act(() => result.current.start());
      await act(async () => {
        finishStop();
        await stopping;
      });

      // 확정 중의 시작은 받지 않으므로, 막힘은 한 번 막고 한 번 풀린 채로 끝난다
      expect(muteHaptics).toHaveBeenCalledTimes(1);
      expect(unmute).toHaveBeenCalledTimes(1);
      expect(result.current.recording).toBe(false);
    });

    it('녹음을 취소하면 푼다', async () => {
      const { result } = renderHook(() => useSentenceRecorder());
      await act(() => result.current.start());

      act(() => result.current.abort());

      expect(unmute).toHaveBeenCalledTimes(1);
    });

    it('녹음 중에 화면을 떠나면 푼다', async () => {
      const { result, unmount } = renderHook(() => useSentenceRecorder());
      await act(() => result.current.start());

      unmount();

      expect(unmute).toHaveBeenCalledTimes(1);
    });

    it('권한이 거부돼 녹음이 시작되지 않으면 막지 않는다', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: vi.fn(async () => {
            throw new DOMException('denied', 'NotAllowedError');
          }),
        },
      });
      const { result } = renderHook(() => useSentenceRecorder());

      await act(() => result.current.start().catch(() => {}));

      expect(muteHaptics).not.toHaveBeenCalled();
    });
  });
});
