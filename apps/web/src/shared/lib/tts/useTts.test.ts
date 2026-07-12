// useTts — voice 없음 스킵, OpenRouter 프록시 요청 계약, 실패·중단 처리 검증
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TtsVoice } from './tts.types';
import { useTts } from './useTts';

const harper: TtsVoice = {
  provider: 'OPENROUTER',
  model: 'microsoft/mai-voice-2',
  providerVoiceId: 'en-US-Harper:MAI-Voice-2',
  gender: 'FEMALE',
};

// 경계 목 — 네트워크(fetch)와 브라우저 오디오(Audio, objectURL)만 가짜로 둔다
class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

function fakeAudioResponse(): Response {
  return {
    ok: true,
    blob: async () => new Blob(['mp3'], { type: 'audio/mpeg' }),
  } as Response;
}

beforeEach(() => {
  FakeAudio.instances = [];
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

  it('재생 중 stop을 부르면 오디오를 멈추고 onEnd를 부른다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeAudioResponse()),
    );
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTts());
    await act(() => result.current.speak('Hello', harper, { onEnd }));

    act(() => result.current.stop());

    expect(FakeAudio.instances[0]!.pause).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
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
});
