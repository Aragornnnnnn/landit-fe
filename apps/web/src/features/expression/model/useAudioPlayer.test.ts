// 오디오 재생 훅이 배속과 재생 오류를 처리하는지 검증한다.
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setSpeechRate } from '@/shared/lib/speech-rate';

import { useAudioPlayer } from './useAudioPlayer';

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  duration = NaN;
  paused = true;
  playbackRate = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  currentTime = 0;
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
  });

  constructor(public src: string) {
    super();
    FakeAudio.instances.push(this);
  }
}

beforeEach(() => {
  localStorage.clear();
  FakeAudio.instances = [];
  vi.stubGlobal('Audio', FakeAudio);
});

afterEach(() => vi.unstubAllGlobals());

describe('useAudioPlayer', () => {
  it('오디오 로드가 실패하면 재생 상태를 초기화한다', () => {
    const { result } = renderHook(() => useAudioPlayer());

    act(() => result.current.play('blob:word', { id: 'my-word-1' }));
    act(() => FakeAudio.instances[0]?.onerror?.());

    expect(result.current.playingId).toBeNull();
  });

  it('이전 음원의 오류가 늦게 도착해도 새 재생을 유지한다', () => {
    const { result } = renderHook(() => useAudioPlayer());
    act(() => result.current.play('blob:old', { id: 'my-word-1' }));
    act(() => result.current.play('blob:new', { id: 'my-word-1' }));

    act(() => FakeAudio.instances[0]?.onerror?.());

    expect(result.current.playingId).toBe('my-word-1');
  });

  it('말하기 속도를 골라두면 예문·녹음 재생도 그 배속으로 튼다', () => {
    setSpeechRate(1.5);
    const { result } = renderHook(() => useAudioPlayer());

    act(() => result.current.play('/audio/example-1.mp3', { id: 'native-1' }));

    expect(FakeAudio.instances[0]!.playbackRate).toBe(1.5);
  });
});
