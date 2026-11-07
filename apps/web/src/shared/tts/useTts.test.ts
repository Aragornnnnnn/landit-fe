// useTts — voice 없음 스킵, OpenRouter 프록시 요청 계약, 실패·중단 처리 검증
// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setSpeechRate } from '@/shared/lib/speech-rate';

import { TtsTimeoutError, useTts } from './useTts';
import type { TtsVoice } from './voice';

const monitoringMock = vi.hoisted(() => ({ reportWarning: vi.fn() }));
vi.mock('@/shared/monitoring/report', () => monitoringMock);

const harper: TtsVoice = {
  provider: 'OPENROUTER',
  model: 'microsoft/mai-voice-2',
  providerVoiceId: 'en-US-Harper:MAI-Voice-2',
  gender: 'FEMALE',
};

// 경계 목 — 네트워크(fetch)와 브라우저 오디오(Audio, objectURL)만 가짜로 둔다
class FakeAudio {
  static instances: FakeAudio[] = [];
  static playRejection: unknown = null; // 설정 시 play()가 이 값으로 거부된다
  src: string;
  preload = 'none';
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() =>
    FakeAudio.playRejection
      ? Promise.reject(FakeAudio.playRejection)
      : Promise.resolve(),
  );
  pause = vi.fn();
  removeAttribute = vi.fn();
  load = vi.fn();
  playbackRate = 1;
  // 멈춤 감시가 읽는 재생 상태 — 테스트가 직접 바꿔 재생 진행을 흉내 낸다
  currentTime = 0;
  // 기본은 재생할 데이터가 다 온 상태(HAVE_ENOUGH_DATA) — 받는 중인 경우는 테스트가 낮춘다
  readyState = 4;
  networkState = 0;
  paused = false;
  listeners = new Map<string, Set<(event: Event) => void>>();
  addEventListener = vi.fn((type: string, fn: (event: Event) => void) => {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
  });
  removeEventListener = vi.fn((type: string, fn: (event: Event) => void) => {
    this.listeners.get(type)?.delete(fn);
  });

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }

  emit(type: string) {
    for (const fn of this.listeners.get(type) ?? []) fn(new Event(type));
  }
}

// 화면 보임 상태를 바꾸고 브라우저처럼 알린다
const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
};

function fakeAudioResponse(): Response {
  return {
    ok: true,
    blob: async () => new Blob(['mp3'], { type: 'audio/mpeg' }),
  } as Response;
}

beforeEach(() => {
  localStorage.clear();
  FakeAudio.instances = [];
  FakeAudio.playRejection = null;
  vi.stubGlobal('Audio', FakeAudio);
  URL.createObjectURL = vi.fn(() => 'blob:fake-url');
  URL.revokeObjectURL = vi.fn();
});

describe('useTts', () => {
  it('voice가 null이면 합성 요청을 보내지 않는다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());

    await act(() => result.current.speak('Hello', null));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('voice가 있으면 프록시에 model과 providerVoiceId로 합성을 요청한다', async () => {
    const fetchMock = vi.fn<
      (url: string, init: RequestInit) => Promise<Response>
    >(async () => fakeAudioResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());

    await act(() => result.current.speak('Hello', harper));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tts',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(body).toEqual({
      input: 'Hello',
      model: 'microsoft/mai-voice-2',
      voice: 'en-US-Harper:MAI-Voice-2',
    });
  });

  it('합성에 성공하면 오디오를 재생하고 onStart를 부른다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    const onStart = vi.fn();
    const { result } = renderHook(() => useTts());

    await act(() => result.current.speak('Hello', harper, { onStart }));

    expect(FakeAudio.instances[0]!.play).toHaveBeenCalled();
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('active');
  });

  it('재생 자체가 실패하면(오디오 onerror) Sentry에 warning으로 보고한다 — 합성은 성공했지만 재생이 깨진 경우', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    const { result } = renderHook(() => useTts());
    await act(() =>
      result.current.speak('Hello', harper, { onError: vi.fn() }),
    );

    act(() => FakeAudio.instances[0]!.onerror?.());

    expect(monitoringMock.reportWarning).toHaveBeenCalledWith(
      expect.objectContaining({ message: '오디오 재생에 실패했어요.' }),
    );
  });

  it('재생이 끝나면 onEnd를 부르고 objectURL을 해제한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTts());
    await act(() => result.current.speak('Hello', harper, { onEnd }));

    act(() => FakeAudio.instances[0]!.onended?.());

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    expect(result.current.status).toBe('idle');
  });

  it('합성 요청이 실패하면 onError를 부르고 status가 error가 된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 502 }) as Response),
    );
    const onError = vi.fn();
    const { result } = renderHook(() => useTts());

    await act(() => result.current.speak('Hello', harper, { onError }));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');
  });

  it('합성 실패를 Sentry에 warning으로 보고한다 — 대화는 폴백으로 계속되지만 빈도는 봐야 한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 502 }) as Response),
    );
    const { result } = renderHook(() => useTts());

    await act(() =>
      result.current.speak('Hello', harper, { onError: vi.fn() }),
    );

    expect(monitoringMock.reportWarning).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('502') }),
    );
  });

  it('stop을 부르면 진행 중인 요청을 중단하고 onError 없이 idle로 돌아간다', async () => {
    // 실제 fetch처럼 abort 시 AbortError로 거부되는 목
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const onError = vi.fn();
    const { result } = renderHook(() => useTts());
    let pending: Promise<void>;
    act(() => {
      pending = result.current.speak('Hello', harper, { onError });
    });

    act(() => result.current.stop());
    await act(() => pending);

    expect(fetchMock.mock.calls[0]![1]!.signal?.aborted).toBe(true);
    expect(onError).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('재생 중 stop을 부르면 오디오를 멈추되 onEnd는 부르지 않는다 (대화 진행에 개입 방지)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTts());
    await act(() => result.current.speak('Hello', harper, { onEnd }));

    act(() => result.current.stop());

    expect(FakeAudio.instances[0]!.pause).toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    expect(result.current.status).toBe('idle');
  });

  it('언마운트되면 재생을 멈추고 objectURL을 해제한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    const { result, unmount } = renderHook(() => useTts());
    await act(() => result.current.speak('Hello', harper));
    const audio = FakeAudio.instances[0]!;

    unmount();

    expect(audio.pause).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });

  it('요청 중 다시 speak하면 이전 요청의 중단이 새 요청의 loading을 덮어쓰지 않는다', async () => {
    // 두 요청 모두 응답 없이 대기 — 첫 요청은 두 번째 speak의 stop으로 abort된다
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());

    act(() => {
      result.current.speak('first', harper);
    });
    // 두 번째 speak가 첫 요청을 abort하고 loading으로 진입한 뒤, 첫 요청의 늦은 중단 처리를 흘려보낸다
    await act(async () => {
      result.current.speak('second', harper);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('loading');
  });

  it('미리 합성(prefetch)해두면 speak가 다시 요청하지 않고 캐시로 재생한다', async () => {
    const fetchMock = vi.fn(async () => fakeAudioResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());

    await act(() => result.current.prefetch('Hello', harper));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(() => result.current.speak('Hello', harper));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(FakeAudio.instances[0]!.play).toHaveBeenCalled();
    expect(result.current.status).toBe('active');
  });

  it('방금 튼 발화를 다시 speak하면 합성 왕복 없이 그대로 다시 튼다 (다시 듣기)', async () => {
    // Given 한 번 재생을 마친 발화가 있을 때
    const fetchMock = vi.fn(async () => fakeAudioResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());
    await act(() => result.current.speak('Hello', harper));
    act(() => FakeAudio.instances[0]!.onended?.());

    // When 같은 발화를 다시 재생하면
    await act(() => result.current.speak('Hello', harper));

    // Then 다시 합성하지 않고 바로 소리가 난다
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(FakeAudio.instances[1]!.play).toHaveBeenCalled();
  });

  it('같은 문장이라도 목소리가 다르면 방금 튼 음원을 재사용하지 않고 다시 합성한다', async () => {
    const fetchMock = vi.fn(async () => fakeAudioResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());
    await act(() => result.current.speak('Hello', harper));
    act(() => FakeAudio.instances[0]!.onended?.());

    await act(() =>
      result.current.speak('Hello', {
        ...harper,
        providerVoiceId: 'en-US-Ethan:MAI-Voice-2',
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('앞 문장을 틀어도 음원이 남아 있어 발화 전체를 합성 없이 다시 듣는다', async () => {
    const fetchMock = vi.fn(async () => fakeAudioResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());
    await act(() => result.current.speak('One', harper));
    act(() => FakeAudio.instances[0]!.onended?.());
    await act(() => result.current.speak('Two', harper));
    act(() => FakeAudio.instances[1]!.onended?.());

    await act(() => result.current.speak('One', harper));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('음원 캐시는 오래된 것부터 비운다 — 대화가 길어져도 메모리가 늘지 않는다', async () => {
    const fetchMock = vi.fn(async () => fakeAudioResponse());
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());
    for (let i = 0; i < 13; i++) {
      await act(() => result.current.speak(`Line ${i}`, harper));
      act(() => FakeAudio.instances.at(-1)!.onended?.());
    }
    expect(fetchMock).toHaveBeenCalledTimes(13);

    await act(() => result.current.speak('Line 0', harper));

    expect(fetchMock).toHaveBeenCalledTimes(14);
  });

  it('prefetchSrc는 음원을 미리 열어두고, speakSrc가 그 엘리먼트로 바로 재생한다', () => {
    const { result } = renderHook(() => useTts());

    act(() => result.current.prefetchSrc('/audio/question-2.mp3'));

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0]!.preload).toBe('auto');
    expect(FakeAudio.instances[0]!.play).not.toHaveBeenCalled();

    act(() => result.current.speakSrc('/audio/question-2.mp3'));

    expect(FakeAudio.instances).toHaveLength(1); // 새로 만들지 않고 재사용
    expect(FakeAudio.instances[0]!.play).toHaveBeenCalled();
  });

  it('prefetchSrc는 같은 주소를 두 번 열지 않는다', () => {
    const { result } = renderHook(() => useTts());

    act(() => {
      result.current.prefetchSrc('/audio/question-2.mp3');
      result.current.prefetchSrc('/audio/question-2.mp3');
    });

    expect(FakeAudio.instances).toHaveLength(1);
  });

  it('prefetchSrc는 새 음원을 열면 이전 항목의 로드를 끊고 비운다', () => {
    const { result } = renderHook(() => useTts());

    act(() => result.current.prefetchSrc('/audio/question-2.mp3'));
    act(() => result.current.prefetchSrc('/audio/question-3.mp3'));

    expect(FakeAudio.instances).toHaveLength(2);
    expect(FakeAudio.instances[0]!.removeAttribute).toHaveBeenCalledWith('src');
    expect(FakeAudio.instances[0]!.load).toHaveBeenCalled();

    act(() => result.current.speakSrc('/audio/question-2.mp3'));

    expect(FakeAudio.instances).toHaveLength(3); // 끊긴 항목은 재사용하지 않고 새로 연다
  });

  it('프리로드가 실패로 끝난 항목은 슬롯에서 내려가 speakSrc가 새로 연다', () => {
    const { result } = renderHook(() => useTts());
    act(() => result.current.prefetchSrc('/audio/question-2.mp3'));

    act(() => FakeAudio.instances[0]!.onerror?.()); // 백그라운드 로드 실패

    act(() => result.current.speakSrc('/audio/question-2.mp3'));

    expect(FakeAudio.instances).toHaveLength(2); // 죽은 항목 대신 새 엘리먼트
    expect(FakeAudio.instances[1]!.play).toHaveBeenCalled();
  });

  it('정지한 뒤 늦게 도착한 프리로드 엘리먼트의 error는 재생을 되살리지 않는다', () => {
    // Given 프리로드 음원을 틀다가 멈춘 상태에서
    const { result } = renderHook(() => useTts());
    act(() => result.current.prefetchSrc('/audio/q.mp3'));
    act(() => result.current.speakSrc('/audio/q.mp3'));
    act(() => result.current.stop());
    const opened = FakeAudio.instances.length;

    // When 그 엘리먼트가 뒤늦게 error를 내면
    act(() => FakeAudio.instances[0]!.onerror?.());

    // Then 새 엘리먼트로 다시 열지 않는다
    expect(FakeAudio.instances.length).toBe(opened);
  });

  it('프리로드 엘리먼트 재생이 실패하면 새 엘리먼트로 한 번 다시 연다', () => {
    const { result } = renderHook(() => useTts());
    const onError = vi.fn();
    act(() => result.current.prefetchSrc('/audio/question-2.mp3'));
    act(() => result.current.speakSrc('/audio/question-2.mp3', { onError }));

    act(() => FakeAudio.instances[0]!.onerror?.()); // 묵는 동안 죽어 있던 엘리먼트

    expect(FakeAudio.instances).toHaveLength(2); // 새 엘리먼트로 재시도
    expect(FakeAudio.instances[1]!.play).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();

    act(() => FakeAudio.instances[1]!.onerror?.()); // 재시도도 실패하면 그때 실패를 알린다

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('합성 재생 실패가 onerror와 play 거부로 겹쳐 도착해도 실패 콜백은 한 번만 부른다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    FakeAudio.playRejection = new Error('boom');
    const onError = vi.fn();
    const { result } = renderHook(() => useTts());

    await act(() => result.current.speak('Hello', harper, { onError }));
    act(() => FakeAudio.instances[0]!.onerror?.()); // 같은 실패가 onerror로도 도착

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('prefetch가 아직 합성 중이면 speak가 중복 요청 없이 그 결과를 재사용한다', async () => {
    // fetch를 수동으로 완료시켜, prefetch 합성이 끝나기 전에 speak가 겹치는 상황을 만든다
    let resolveFetch: (r: Response) => void = () => {};
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((res) => {
          resolveFetch = res;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());

    // prefetch 시작 — 아직 합성 중(미해결)
    let prefetching: Promise<void>;
    act(() => {
      prefetching = result.current.prefetch('Hello', harper);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 합성이 끝나기 전에 speak가 겹쳐도 새 요청을 만들지 않고 진행 중인 합성을 재사용한다
    let speaking: Promise<void>;
    act(() => {
      speaking = result.current.speak('Hello', harper);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // 합성 완료 → speak가 그 결과로 재생
    await act(async () => {
      resolveFetch(fakeAudioResponse());
      await prefetching;
      await speaking;
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(FakeAudio.instances[0]!.play).toHaveBeenCalled();
    expect(result.current.status).toBe('active');
  });

  it('speakSrc는 합성 없이 정적 URL을 바로 재생하고, 끝나면 onEnd를 부른다', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTts());

    await act(async () => {
      result.current.speakSrc('/audio/opening-1.mp3', { onEnd });
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(FakeAudio.instances[0]!.src).toBe('/audio/opening-1.mp3');
    expect(FakeAudio.instances[0]!.play).toHaveBeenCalled();
    expect(result.current.status).toBe('active');

    act(() => FakeAudio.instances[0]!.onended?.());

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
  });

  it('speakSrc 재생이 실패하면 onError를 부른다 (정적 파일 없음 등)', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const onError = vi.fn();
    const { result } = renderHook(() => useTts());

    await act(async () => {
      result.current.speakSrc('/audio/missing.mp3', { onError });
    });
    act(() => FakeAudio.instances[0]!.onerror?.());

    expect(onError).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');
  });

  it('speakSrc의 play가 stop(pause)으로 중단(AbortError)되면 onError를 부르지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn());
    FakeAudio.playRejection = new DOMException(
      'interrupted by pause',
      'AbortError',
    );
    const onError = vi.fn();
    const { result } = renderHook(() => useTts());

    await act(async () => {
      result.current.speakSrc('/audio/opening-1.mp3', { onError });
    });

    // AbortError는 합성 폴백을 부르지 않는다 (정적 재생이 그대로 유지되도록)
    expect(onError).not.toHaveBeenCalled();
  });
  it('말하기 속도를 느리게 골라두면 합성 음성이 그 배속으로 재생된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    setSpeechRate(0.75);
    const { result } = renderHook(() => useTts());

    await act(() => result.current.speak('Hello', harper));

    expect(FakeAudio.instances[0].playbackRate).toBe(0.75);
  });

  it('미리 열어둔 음원도 재생하는 시점의 배속으로 튼다 — 프리로드 때 넣으면 그 사이 바뀐 설정을 놓친다', () => {
    vi.stubGlobal('fetch', vi.fn());
    const { result } = renderHook(() => useTts());

    act(() => result.current.prefetchSrc('/audio/question-2.mp3'));
    setSpeechRate(1.5);
    act(() => result.current.speakSrc('/audio/question-2.mp3'));

    expect(FakeAudio.instances).toHaveLength(1);
    expect(FakeAudio.instances[0].playbackRate).toBe(1.5);
  });

  describe('합성 응답이 오지 않을 때', () => {
    // 실제 fetch처럼 응답 없이 멈춰 있다가 abort되면 AbortError로 거부되는 목
    const hangingFetch = () =>
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      );

    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('제한 시간이 지나면 요청을 끊고 실패로 알려 대화가 멈추지 않는다', async () => {
      // Given
      const fetchMock = hangingFetch();
      vi.stubGlobal('fetch', fetchMock);
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      await act(async () => {
        void result.current.speak('Hello', harper, { onError });
        await vi.advanceTimersByTimeAsync(25_000);
      });

      // Then
      expect(fetchMock.mock.calls[0]![1]!.signal?.aborted).toBe(true);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(TtsTimeoutError);
      expect(result.current.status).toBe('error');
    });

    it('미리 받던 합성이 응답 없이 끝나면 다시 기다리지 않고 바로 실패로 알린다', async () => {
      // Given
      const fetchMock = hangingFetch();
      vi.stubGlobal('fetch', fetchMock);
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      await act(async () => {
        void result.current.prefetch('Hello', harper);
        void result.current.speak('Hello', harper, { onError });
        await vi.advanceTimersByTimeAsync(25_000);
      });

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(TtsTimeoutError);
    });

    it('이미 멈춘 재생은 뒤늦은 시간 초과를 오류로 알리지 않는다', async () => {
      // Given 미리 받는 합성을 기다리다가 재생을 멈췄다
      vi.stubGlobal('fetch', hangingFetch());
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());
      await act(async () => {
        void result.current.prefetch('Hello', harper);
        void result.current.speak('Hello', harper, { onError });
        result.current.stop();
      });

      // When
      await act(() => vi.advanceTimersByTimeAsync(25_000));

      // Then
      expect(onError).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
      expect(monitoringMock.reportWarning).not.toHaveBeenCalled();
    });

    it('화면을 떠나면 미리 받던 합성도 끊는다', async () => {
      // Given
      const fetchMock = hangingFetch();
      vi.stubGlobal('fetch', fetchMock);
      const { result, unmount } = renderHook(() => useTts());
      void result.current.prefetch('Hello', harper);

      // When
      unmount();

      // Then
      expect(fetchMock.mock.calls[0]![1]!.signal?.aborted).toBe(true);
    });

    it('제때 도착한 합성은 제한 시간과 상관없이 재생한다', async () => {
      // Given
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => fakeAudioResponse()),
      );
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      await act(async () => {
        await result.current.speak('Hello', harper, { onError });
        await vi.advanceTimersByTimeAsync(60_000);
      });

      // Then
      expect(onError).not.toHaveBeenCalled();
      expect(FakeAudio.instances).toHaveLength(1);
    });
  });

  describe('합성 요청이 한도에 걸릴 때 (429)', () => {
    const rateLimited = () => new Response('{}', { status: 429 });

    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('잠깐 기다렸다 다시 요청해 재생한다', async () => {
      // Given
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(rateLimited())
        .mockResolvedValueOnce(fakeAudioResponse());
      vi.stubGlobal('fetch', fetchMock);
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      await act(async () => {
        void result.current.speak('Hello', harper, { onError });
        await vi.advanceTimersByTimeAsync(0);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(2_000);
      });

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(onError).not.toHaveBeenCalled();
      expect(FakeAudio.instances).toHaveLength(1);
    });

    it('계속 한도에 걸리면 정해진 횟수만 다시 묻고 실패로 알린다', async () => {
      // Given
      const fetchMock = vi.fn(async () => rateLimited());
      vi.stubGlobal('fetch', fetchMock);
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      await act(async () => {
        void result.current.speak('Hello', harper, { onError });
        await vi.advanceTimersByTimeAsync(10_000);
      });

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('미리 받던 합성이 한도로 끝나면 재생이 처음부터 다시 묻지 않는다 — 몰릴수록 요청이 불어나면 안 된다', async () => {
      // Given
      const fetchMock = vi.fn(async () => rateLimited());
      vi.stubGlobal('fetch', fetchMock);
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      await act(async () => {
        void result.current.prefetch('Hello', harper);
        void result.current.speak('Hello', harper, { onError });
        await vi.advanceTimersByTimeAsync(10_000);
      });

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('한도 외의 합성 실패는 기다리지 않고 바로 실패로 알린다', async () => {
      // Given
      const fetchMock = vi.fn(async () => new Response('{}', { status: 500 }));
      vi.stubGlobal('fetch', fetchMock);
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      await act(async () => {
        await result.current.speak('Hello', harper, { onError });
      });

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('기다리는 동안 재생을 멈추면 다시 요청하지 않는다', async () => {
      // Given
      const fetchMock = vi.fn(async () => rateLimited());
      vi.stubGlobal('fetch', fetchMock);
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());
      await act(async () => {
        void result.current.speak('Hello', harper, { onError });
        await vi.advanceTimersByTimeAsync(0);
      });

      // When
      act(() => result.current.stop());
      await act(() => vi.advanceTimersByTimeAsync(10_000));

      // Then
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('재생이 멈췄을 때', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => fakeAudioResponse()),
      );
      setVisibility('visible');
    });

    afterEach(() => {
      vi.useRealTimers();
      // 덮어쓴 보임 상태를 걷어 jsdom 원래 값으로 돌린다
      Reflect.deleteProperty(document, 'visibilityState');
    });

    it('재생 위치가 3초 동안 그대로면 멈춤을 한 번 알리고, 소리는 끄지 않는다', () => {
      // Given — 정적 음원 재생을 걸었지만 재생 위치가 0에서 움직이지 않는다
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));
      const audio = FakeAudio.instances[0]!;

      // When
      act(() => vi.advanceTimersByTime(2_999));
      expect(onStall).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));

      // Then — 알리기만 하고 재생은 그대로 둔다(다시 움직이면 끝까지 들린다)
      expect(onStall).toHaveBeenCalledTimes(1);
      expect(onStall).toHaveBeenCalledWith(
        expect.objectContaining({ started: false, positionMs: 0 }),
      );
      expect(audio.pause).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(10_000));
      expect(onStall).toHaveBeenCalledTimes(1);
    });

    it('재생 위치가 움직이면 처음부터 다시 센다', () => {
      // Given
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));
      const audio = FakeAudio.instances[0]!;
      act(() => vi.advanceTimersByTime(2_500));

      // When — 망이 느려 늦게 시작했지만 결국 재생이 나아간다
      audio.currentTime = 0.4;
      act(() => vi.advanceTimersByTime(2_500));

      // Then — 움직임을 확인한 때(3초 시점)부터 다시 3초가 차기 전엔 멈춤이 아니다
      expect(onStall).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(999));
      expect(onStall).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onStall).toHaveBeenCalledWith(
        expect.objectContaining({ started: true, positionMs: 400 }),
      );
    });

    it('화면이 숨겨진 동안은 세지 않고, 돌아오면 처음부터 센다 — 숨겨지면 재생을 멈춰 두므로 멈춤이 아니다', () => {
      // Given
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));
      act(() => vi.advanceTimersByTime(2_000));

      // When — 앱을 내렸다가 한참 뒤 돌아온다
      act(() => setVisibility('hidden'));
      act(() => vi.advanceTimersByTime(60_000));
      act(() => setVisibility('visible'));

      // Then
      expect(onStall).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(2_999));
      expect(onStall).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onStall).toHaveBeenCalledTimes(1);
    });

    it('끝까지 재생되면 감시도 끝난다', () => {
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));

      act(() => FakeAudio.instances[0]!.onended?.());
      act(() => vi.advanceTimersByTime(10_000));

      expect(onStall).not.toHaveBeenCalled();
    });

    it('재생을 멈추면 감시도 끝난다', () => {
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));

      act(() => result.current.stop());
      act(() => vi.advanceTimersByTime(10_000));

      expect(onStall).not.toHaveBeenCalled();
    });

    it('재생이 실패하면 감시도 끝난다 — 실패는 실패로만 알린다', () => {
      const onStall = vi.fn();
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall, onError }));

      act(() => FakeAudio.instances[0]!.onerror?.());
      act(() => vi.advanceTimersByTime(10_000));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onStall).not.toHaveBeenCalled();
    });

    it('합성 음성 재생이 거부되면 실패만 알리고 멈춤은 알리지 않는다', async () => {
      FakeAudio.playRejection = new DOMException('blocked', 'NotAllowedError');
      const onStall = vi.fn();
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());

      await act(() =>
        result.current.speak('Hello', harper, { onStall, onError }),
      );
      act(() => vi.advanceTimersByTime(10_000));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onStall).not.toHaveBeenCalled();
    });

    it('다음 재생으로 넘어가면 앞 재생의 감시는 끝난다', () => {
      const first = vi.fn();
      const second = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/a.mp3', { onStall: first }));
      act(() => vi.advanceTimersByTime(2_000));

      act(() => result.current.speakSrc('/audio/b.mp3', { onStall: second }));
      act(() => vi.advanceTimersByTime(3_000));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('미리 열어 둔 음원이 실패해 새로 열면 새 엘리먼트를 한 번만 감시한다', () => {
      // Given
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.prefetchSrc('/audio/q.mp3'));
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));

      // When
      act(() => FakeAudio.instances[0]!.onerror?.());
      act(() => vi.advanceTimersByTime(3_000));

      // Then
      expect(FakeAudio.instances).toHaveLength(2);
      expect(onStall).toHaveBeenCalledTimes(1);
    });

    it('합성 음성도 재생을 건 뒤부터 감시한다 — 합성을 기다리는 시간은 따로 제한한다', async () => {
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());

      await act(() => result.current.speak('Hello', harper, { onStall }));
      act(() => vi.advanceTimersByTime(3_000));

      expect(onStall).toHaveBeenCalledTimes(1);
    });

    it('멈춘 순간의 오디오 상태를 함께 알린다 — 왜 멈췄는지 좁히는 단서다', () => {
      // Given — 받다가 멈춘 상태
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));
      const audio = FakeAudio.instances[0]!;
      audio.readyState = 1;
      audio.networkState = 2;
      audio.paused = true;

      // When
      act(() => audio.emit('waiting'));
      act(() => audio.emit('stalled'));
      act(() => vi.advanceTimersByTime(3_000));

      // Then
      expect(onStall).toHaveBeenCalledWith({
        started: false,
        positionMs: 0,
        readyState: 1,
        networkState: 2,
        paused: true,
        lastMediaEvent: 'stalled',
        backgrounded: false,
      });
    });

    it('이 재생 중 앱이 내려간 적 있으면 함께 알린다 — 돌아와 다시 건 재생이 막힌 것과 다른 원인을 가른다', () => {
      // Given
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));

      // When — 내렸다가 돌아왔는데 재생 위치가 그대로다
      act(() => setVisibility('hidden'));
      act(() => setVisibility('visible'));
      act(() => vi.advanceTimersByTime(3_000));

      // Then
      expect(onStall).toHaveBeenCalledWith(
        expect.objectContaining({ backgrounded: true }),
      );
    });

    it('앱이 내려간 채 건 재생도 내려간 적 있는 것으로 본다', () => {
      // Given
      setVisibility('hidden');
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));

      // When
      act(() => setVisibility('visible'));
      act(() => vi.advanceTimersByTime(3_000));

      // Then
      expect(onStall).toHaveBeenCalledWith(
        expect.objectContaining({ backgrounded: true }),
      );
    });

    it('받는 중이어도 같은 3초로 본다 — 질문 음원은 70KB 이하라 정상이면 3초 안에 내려온다', () => {
      // Given — 음원을 받는 중이라 재생할 데이터가 아직 없다
      const onStall = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall }));
      FakeAudio.instances[0]!.readyState = 1;

      // When
      act(() => vi.advanceTimersByTime(3_000));

      // Then
      expect(onStall).toHaveBeenCalledWith(
        expect.objectContaining({ readyState: 1 }),
      );
    });

    it('멈춘 뒤 재생 위치가 다시 움직이면 다시 나온다고 알리고, 또 멈추면 다시 알린다', () => {
      // Given — 멈춤을 이미 알렸다
      const onStall = vi.fn();
      const onResume = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall, onResume }));
      const audio = FakeAudio.instances[0]!;
      act(() => vi.advanceTimersByTime(3_000));
      expect(onStall).toHaveBeenCalledTimes(1);

      // When — 소리가 다시 나아간다
      audio.currentTime = 0.5;
      act(() => vi.advanceTimersByTime(500));

      // Then — 재생 위치가 마지막으로 움직인 뒤 다시 움직이기까지 걸린 시간을 함께 알린다
      expect(onResume).toHaveBeenCalledTimes(1);
      expect(onResume).toHaveBeenCalledWith({ stalledMs: 3_500 });
      act(() => vi.advanceTimersByTime(3_000));
      expect(onStall).toHaveBeenCalledTimes(2);
      expect(onResume).toHaveBeenCalledTimes(1);
    });

    it('멈추기 전에는 움직여도 다시 나온다고 알리지 않는다', () => {
      const onResume = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() =>
        result.current.speakSrc('/audio/q.mp3', { onStall: vi.fn(), onResume }),
      );
      const audio = FakeAudio.instances[0]!;

      audio.currentTime = 0.5;
      act(() => vi.advanceTimersByTime(500));

      expect(onResume).not.toHaveBeenCalled();
    });

    it('감시가 끝나면 엘리먼트에 붙인 귀를 뗀다', () => {
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStall: vi.fn() }));
      const audio = FakeAudio.instances[0]!;

      act(() => audio.onended?.());

      for (const listeners of audio.listeners.values())
        expect(listeners.size).toBe(0);
    });
  });

  // iOS 웹뷰는 앱이 내려가 있을 때 시작한 재생을 막고도 재생 중으로 남겨, 끝 신호가 오지 않는다
  describe('앱이 내려가 있을 때', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => fakeAudioResponse()),
      );
      setVisibility('visible');
    });

    afterEach(() => {
      Reflect.deleteProperty(document, 'visibilityState');
    });

    it('내려가 있는 동안 건 음원은 틀지 않고 기다렸다가, 돌아오면 튼다', async () => {
      // Given
      setVisibility('hidden');
      const onStart = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      act(() => result.current.speakSrc('/audio/q.mp3', { onStart }));
      await act(async () => {});

      // Then
      const audio = FakeAudio.instances[0]!;
      expect(audio.play).not.toHaveBeenCalled();
      expect(onStart).not.toHaveBeenCalled();
      await act(async () => setVisibility('visible'));
      expect(audio.play).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('active');
    });

    it('합성 음성도 내려가 있는 동안엔 기다렸다가, 돌아오면 튼다', async () => {
      // Given
      setVisibility('hidden');
      const onStart = vi.fn();
      const { result } = renderHook(() => useTts());

      // When
      let spoken = false;
      act(() => {
        void result.current
          .speak('Hello', harper, { onStart })
          .then(() => (spoken = true));
      });
      await act(async () => {});

      // Then
      const audio = FakeAudio.instances[0]!;
      expect(audio.play).not.toHaveBeenCalled();
      expect(spoken).toBe(false);
      await act(async () => setVisibility('visible'));
      expect(audio.play).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledTimes(1);
      expect(spoken).toBe(true);
    });

    it('재생 중에 앱을 내리면 멈췄다가, 돌아오면 이어서 튼다', async () => {
      // Given
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3'));
      await act(async () => {});
      const audio = FakeAudio.instances[0]!;

      // When
      act(() => setVisibility('hidden'));

      // Then
      expect(audio.pause).toHaveBeenCalledTimes(1);
      act(() => setVisibility('visible'));
      expect(audio.play).toHaveBeenCalledTimes(2);
    });

    it('재생이 시작되길 기다리는 중에 앱을 내려도 실패로 알리지 않고, 돌아오면 튼다', async () => {
      // Given — 브라우저처럼 시작 전에 pause()가 들어오면 play()가 AbortError로 거부된다.
      // 미리 열어 둔 엘리먼트라 play를 걸기 전에 그 동작을 심을 수 있다
      const onStart = vi.fn();
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.prefetchSrc('/audio/q.mp3'));
      const audio = FakeAudio.instances[0]!;
      let interrupt: () => void = () => {};
      audio.play.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            interrupt = () =>
              reject(new DOMException('interrupted', 'AbortError'));
          }),
      );
      audio.pause.mockImplementationOnce(() => interrupt());
      act(() => result.current.speakSrc('/audio/q.mp3', { onStart, onError }));

      // When
      await act(async () => setVisibility('hidden'));

      // Then — 실패도 아니고, 프리로드가 죽은 것으로 보고 새로 열지도 않는다
      expect(onError).not.toHaveBeenCalled();
      expect(FakeAudio.instances).toHaveLength(1);
      await act(async () => setVisibility('visible'));
      expect(audio.play).toHaveBeenCalledTimes(2);
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('기다리는 동안 재생을 멈추면 돌아와도 틀지 않는다', async () => {
      // Given
      setVisibility('hidden');
      const onError = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onError }));

      // When
      act(() => result.current.stop());
      await act(async () => setVisibility('visible'));

      // Then
      expect(FakeAudio.instances[0]!.play).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });

    it('끝나기 직전에 내려 멈춰 둔 사이 끝 신호가 오면, 돌아와도 처음부터 다시 틀지 않는다', async () => {
      // Given — 실기기에서 끝 0.03초 전에 내리자 멈춘 뒤에도 끝 신호가 왔다
      const onEnd = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onEnd }));
      await act(async () => {});
      const audio = FakeAudio.instances[0]!;

      // When
      act(() => setVisibility('hidden'));
      act(() => audio.onended?.());
      act(() => setVisibility('visible'));

      // Then
      expect(audio.play).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('끝난 재생은 앱을 내렸다 올려도 다시 틀지 않는다', async () => {
      // Given
      const onEnd = vi.fn();
      const { result } = renderHook(() => useTts());
      act(() => result.current.speakSrc('/audio/q.mp3', { onEnd }));
      await act(async () => {});
      const audio = FakeAudio.instances[0]!;
      act(() => audio.onended?.());

      // When
      act(() => setVisibility('hidden'));
      act(() => setVisibility('visible'));

      // Then
      expect(audio.play).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  it('진행 중인 합성을 또 미리 받으려 하면 새로 요청하지 않고 끝날 때까지 기다린다', async () => {
    // Given
    let finish: (response: Response) => void = () => {};
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useTts());
    void result.current.prefetch('Hello', harper);
    let secondDone = false;

    // When
    void result.current.prefetch('Hello', harper).then(() => {
      secondDone = true;
    });
    await act(async () => {});

    // Then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(secondDone).toBe(false);
    await act(async () => finish(fakeAudioResponse()));
    expect(secondDone).toBe(true);
  });
});
