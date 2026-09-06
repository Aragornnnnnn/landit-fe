// 녹음 배선 훅 검증 — StrictMode 이중 이펙트에도 세션이 살아남는지(재발 방지)와 기본 계약
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSentenceRecorder } from './useSentenceRecorder';

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
});
