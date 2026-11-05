// 오디오 재생 훅 검증 — 구간 재생의 시작 위치 이동 시점(iOS가 로드 전 seek를 버리는 버그 재현)
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setSpeechRate } from '@/shared/lib/speech-rate';

import { useAudioPlayer } from './useAudioPlayer';

// 경계 목 — iOS 사파리처럼 메타데이터가 로드되기 전(readyState 0)의 currentTime 세팅을 버린다
class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = [];
  readyState = 0;
  duration = NaN;
  paused = true;
  volume = 1;
  playbackRate = 1;
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
  localStorage.clear();
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
  it('말하기 속도를 골라두면 예문·녹음 재생도 그 배속으로 튼다', () => {
    setSpeechRate(1.5);
    const { result } = renderHook(() => useAudioPlayer());

    act(() => result.current.play('/audio/example-1.mp3', { id: 'native-1' }));

    expect(FakeAudio.instances[0]!.playbackRate).toBe(1.5);
  });

  it('진단을 켜면 요청과 seek 완료 시점의 실제 위치를 분리해 기록한다', () => {
    const capture = vi.fn();
    const { result } = renderHook(() => useAudioPlayer());

    act(() =>
      result.current.play('blob:private-recording', {
        segment: { startMs: 1200, endMs: 1800 },
        createDiagnosticSink: () => capture,
      }),
    );
    const audio = FakeAudio.instances[0]!;
    act(() => {
      audio.loadMetadata();
      audio.currentTime = 1.45;
      audio.dispatchEvent(new Event('seeked'));
    });

    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'seek-requested', currentTimeMs: 0 }),
    );
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'seeked', currentTimeMs: 1450 }),
    );
    expect(JSON.stringify(capture.mock.calls)).not.toContain(
      'blob:private-recording',
    );
  });

  it('렌더 전 같은 단어를 연속으로 토글해도 재생을 시작할 때만 진단을 만든다', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const createDiagnosticSink = vi.fn(() => vi.fn());
    const options = { id: 'my-word-1', createDiagnosticSink };

    act(() => {
      result.current.toggle('blob:recording', options);
      result.current.toggle('blob:recording', options);
      result.current.toggle('blob:recording', options);
    });

    expect(FakeAudio.instances).toHaveLength(2);
    expect(createDiagnosticSink).toHaveBeenCalledTimes(2);
    expect(result.current.playingId).toBe('my-word-1');
  });

  it('재생을 바꾸거나 화면을 떠나면 이전 오디오의 진단 리스너를 정리한다', () => {
    const capture = vi.fn();
    const { result, unmount } = renderHook(() => useAudioPlayer());
    act(() =>
      result.current.play('blob:first', {
        createDiagnosticSink: () => capture,
      }),
    );
    const previous = FakeAudio.instances[0]!;

    act(() =>
      result.current.play('blob:second', {
        createDiagnosticSink: () => capture,
      }),
    );
    unmount();
    const count = capture.mock.calls.length;
    previous.dispatchEvent(new Event('seeked'));
    FakeAudio.instances[1]!.dispatchEvent(new Event('playing'));

    expect(capture.mock.calls).toHaveLength(count);
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'superseded' }),
    );
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'unmount' }),
    );
  });

  it('진단 콜백이 실패해도 오디오 재생과 종료를 방해하지 않는다', () => {
    const capture = () => {
      throw new Error('diagnostic failed');
    };
    const { result } = renderHook(() => useAudioPlayer());

    act(() =>
      result.current.play('blob:recording', {
        createDiagnosticSink: () => capture,
      }),
    );
    act(() => result.current.stop());

    expect(FakeAudio.instances[0]!.play).toHaveBeenCalled();
    expect(FakeAudio.instances[0]!.paused).toBe(true);
  });

  it('프레임 감시가 지연되면 종료 위치와 마지막 프레임 이후 경과 시간을 함께 남긴다', () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const capture = vi.fn();
    const { result } = renderHook(() => useAudioPlayer());
    act(() =>
      result.current.play('blob:recording', {
        segment: { startMs: 1200, endMs: 1500 },
        createDiagnosticSink: () => capture,
      }),
    );
    const audio = FakeAudio.instances[0]!;
    act(() => audio.loadMetadata());

    now = 400;
    audio.currentTime = 1.7;
    act(() => result.current.stop());

    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'finish-stopped',
        currentTimeMs: 1700,
        sinceLastFrameMs: 400,
        paused: true,
      }),
    );
  });

  it('자동재생 거부는 정상 완료와 구별되는 진단 이벤트로 남긴다', async () => {
    const capture = vi.fn();
    const { result } = renderHook(() => useAudioPlayer());
    // play는 인스턴스 필드이므로 Audio 생성 경계에서 거부 동작을 주입한다.
    class RejectedAudio extends FakeAudio {
      play = vi.fn(() =>
        Promise.reject(new DOMException('private details', 'NotAllowedError')),
      );
    }
    vi.stubGlobal('Audio', RejectedAudio);

    await act(async () =>
      result.current.play('blob:recording', {
        createDiagnosticSink: () => capture,
      }),
    );

    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'play-rejected' }),
    );
    expect(JSON.stringify(capture.mock.calls)).not.toContain('private details');
  });
});
