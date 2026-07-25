// useStt 훅 — 권한 거부·폴백 전환·턴 종료 상태 전이 갈림길 검증
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStt } from './useStt';

class FakeRecognition {
  static instances: FakeRecognition[] = [];

  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.started = true;
  }

  stop() {
    this.onend?.();
  }
}

describe('useStt', () => {
  beforeEach(() => {
    FakeRecognition.instances = [];
    // Deepgram 경로는 막고(MediaRecorder 없음) 폴백만 열어둔 기본 환경
    vi.stubGlobal('MediaRecorder', undefined);
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('마이크 권한이 거부되면 폴백을 시도하지 않고 에러 상태가 된다', async () => {
    // Deepgram 경로가 살아 있어야 getUserMedia 거부까지 도달한다
    vi.stubGlobal(
      'MediaRecorder',
      class {
        static isTypeSupported = () => true;
      },
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(async () => {
          throw new DOMException('denied', 'NotAllowedError');
        }),
      },
      configurable: true,
    });
    const { result } = renderHook(() => useStt());

    await act(() => result.current.start());

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('마이크 권한이 거부되었습니다.');
    expect(FakeRecognition.instances).toHaveLength(0);
  });

  it('Deepgram을 못 쓰는 환경이면 브라우저 음성 인식으로 폴백해 듣기 시작한다', async () => {
    const { result } = renderHook(() => useStt());

    await act(() => result.current.start());

    expect(result.current.status).toBe('listening');
    expect(FakeRecognition.instances.at(-1)?.started).toBe(true);
  });

  it('폴백까지 실패하면 에러 상태가 된다', async () => {
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const { result } = renderHook(() => useStt());

    await act(() => result.current.start());

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toContain(
      '음성 인식을 지원하지 않습니다',
    );
  });

  it('에러가 나면 onError 콜백으로 알린다', async () => {
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const onError = vi.fn();
    const { result } = renderHook(() => useStt({ onError }));

    await act(() => result.current.start());

    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('발화가 끝나면 transcript가 확정되고 다시 idle로 돌아간다', async () => {
    const onFinal = vi.fn();
    const { result } = renderHook(() => useStt({ onFinal }));
    await act(() => result.current.start());
    const recognition = FakeRecognition.instances.at(-1)!;

    act(() => {
      recognition.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { 0: { transcript: '안녕하세요' }, isFinal: true },
        },
      });
      recognition.onend?.();
    });

    expect(result.current.transcript).toBe('안녕하세요');
    expect(result.current.status).toBe('idle');
    expect(result.current.isListening).toBe(false);
    expect(onFinal).toHaveBeenCalledWith('안녕하세요');
  });
});
