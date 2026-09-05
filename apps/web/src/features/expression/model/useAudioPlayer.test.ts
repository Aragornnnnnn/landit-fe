// 오디오 재생 훅 검증 — 구간 재생의 시작 위치 이동 시점(iOS가 로드 전 seek를 버리는 버그 재현)
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioPlayer } from './useAudioPlayer';

// 경계 목 — iOS 사파리처럼 메타데이터가 로드되기 전(readyState 0)의 currentTime 세팅을 버린다
class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  readyState = 0;
  duration = NaN;
  paused = true;
  volume = 1;
  onended: (() => void) | null = null;
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  #currentTime = 0;

  constructor(public src: string) {
    super();
    FakeAudio.instances.push(this);
  }

  get currentTime() {
    return this.#currentTime;
  }

  set currentTime(value: number) {
    if (this.readyState === 0) return;
    this.#currentTime = value;
  }

  loadMetadata() {
    this.readyState = 1;
    this.dispatchEvent(new Event('loadedmetadata'));
  }
}

beforeEach(() => {
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
});

afterEach(() => vi.unstubAllGlobals());

describe('useAudioPlayer', () => {
  it('구간 재생은 메타데이터가 로드된 뒤 시작 위치로 이동한다 — iOS가 로드 전 seek를 버려 0초부터 나오던 버그 재현', () => {
    const { result } = renderHook(() => useAudioPlayer());

    act(() =>
      result.current.play('blob:recording', {
        id: 'my-word-1',
        segment: { startMs: 1200, endMs: 1800 },
      }),
    );
    const audio = FakeAudio.instances[0]!;
    act(() => audio.loadMetadata());

    expect(audio.currentTime).toBe(1.2);
  });
});
