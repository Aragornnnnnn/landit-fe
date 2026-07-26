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

  abort() {
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
    const onError = vi.fn();
    const { result } = renderHook(() => useStt({ onError }));

    await act(() => result.current.start());

    expect(onError.mock.calls[0][0].message).toBe(
      '마이크 권한이 거부되었습니다.',
    );
    expect(FakeRecognition.instances).toHaveLength(0);
  });

  it('Deepgram을 못 쓰는 환경이면 브라우저 음성 인식으로 폴백해 듣기 시작한다', async () => {
    const { result } = renderHook(() => useStt());

    await act(() => result.current.start());

    expect(FakeRecognition.instances.at(-1)?.started).toBe(true);
  });

  it('폴백까지 실패하면 실패를 알린다', async () => {
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const onError = vi.fn();
    const { result } = renderHook(() => useStt({ onError }));

    await act(() => result.current.start());

    expect(onError.mock.calls[0][0].message).toContain(
      '음성 인식을 지원하지 않습니다',
    );
  });

  it('에러가 나면 onError 콜백으로 알린다', async () => {
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    const onError = vi.fn();
    const { result } = renderHook(() => useStt({ onError }));

    await act(() => result.current.start());

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('abort하면 결과 없이 즉시 끝나고 바로 다시 시작할 수 있다', async () => {
    const onFinal = vi.fn();
    const onInterim = vi.fn();
    const { result } = renderHook(() => useStt({ onFinal, onInterim }));
    await act(() => result.current.start());

    act(() => result.current.abort());

    // 파기된 세션이 뒤늦게 내는 중간 결과·종료가 전부 무시된다 — 지운 자막이 되살아나지 않는다
    act(() => {
      const recognition = FakeRecognition.instances.at(-1)!;
      recognition.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: { 0: { transcript: '되살아날 뻔한 글자' }, isFinal: false },
        },
      });
      recognition.onend?.();
    });
    expect(onInterim).not.toHaveBeenCalled();
    expect(onFinal).not.toHaveBeenCalled();

    // 확정을 기다릴 필요가 없으니 곧바로 재시작된다 — 잠김 버그의 핵심 검증
    await act(() => result.current.start());
    expect(FakeRecognition.instances).toHaveLength(2);
    expect(FakeRecognition.instances.at(-1)?.started).toBe(true);
  });

  it('연결 중에 abort하면 뒤늦게 완성된 세션도 파기된다', async () => {
    // Deepgram 시작(권한→토큰→소켓)은 비동기라, 그 진행 중의 취소가 씹히면 유령 마이크가 된다
    class GateRecorder {
      static isTypeSupported = () => true;
      state = 'recording';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      start() {}
      stop() {
        this.state = 'inactive';
      }
    }
    class GateWs {
      static CONNECTING = 0;
      static OPEN = 1;
      static instances: GateWs[] = [];
      readyState = 0;
      onopen: (() => void) | null = null;
      onmessage: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onclose: (() => void) | null = null;
      constructor() {
        GateWs.instances.push(this);
      }
      send() {}
      close() {
        this.readyState = 3;
      }
    }
    vi.stubGlobal('MediaRecorder', GateRecorder);
    vi.stubGlobal('WebSocket', GateWs);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ token: 't' }) })),
    );
    let releaseMedia!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseMedia = resolve;
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(async () => {
          await gate; // 마이크 준비를 붙잡아 "연결 중" 상태를 만든다
          return { getTracks: () => [{ stop: vi.fn() }] };
        }),
      },
      configurable: true,
    });
    const onFinal = vi.fn();
    const { result } = renderHook(() => useStt({ onFinal }));

    let startPromise!: Promise<void>;
    act(() => {
      startPromise = result.current.start(); // 연결 중...
    });
    act(() => result.current.abort()); // 그 사이 취소
    await act(async () => {
      releaseMedia(); // 뒤늦게 마이크 준비 완료
      await startPromise;
    });

    expect(onFinal).not.toHaveBeenCalled();
    // 뒤늦게 완성된 세션이 설치되지 않았어야, 재시작이 막히지 않고 새 연결이 만들어진다
    await act(() => result.current.start());
    expect(GateWs.instances).toHaveLength(2);
  });

  it('발화가 끝나면 onFinal로 확정 텍스트를 전달한다', async () => {
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

    expect(onFinal).toHaveBeenCalledWith('안녕하세요');
  });
});
