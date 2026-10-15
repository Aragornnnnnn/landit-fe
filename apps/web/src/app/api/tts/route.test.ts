// TTS 프록시 라우트 — 키 부재·입력 누락·업스트림 분기·업스트림 실패·성공 스트림 갈림길 검증
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const reportErrorMock = vi.hoisted(() => vi.fn());
vi.mock('@/shared/monitoring/report', () => ({
  reportError: reportErrorMock,
}));

function ttsRequest(body: unknown): Request {
  return new Request('http://localhost/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  input: 'Hello',
  model: 'microsoft/mai-voice-2',
  voice: 'en-US-Harper:MAI-Voice-2',
};

const deepgramBody = {
  input: 'Hello',
  model: 'deepgram/aura-2',
  voice: 'aura-2-orpheus-en',
};

describe('POST /api/tts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('OPENROUTER_API_KEY가 없으면 500을 돌려준다', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');

    const res = await POST(ttsRequest(validBody));

    expect(res.status).toBe(500);
  });

  it('input·model·voice 중 하나라도 없으면 400을 돌려준다', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'real-key');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(ttsRequest({ input: 'Hello' }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('input이 길이 상한을 넘으면 400을 돌려주고 합성을 부르지 않는다', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'real-key');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(
      ttsRequest({ ...validBody, input: 'a'.repeat(1001) }),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Deepgram 음성은 OpenRouter를 거치지 않고 Deepgram에 TTS 전용 키로 합성한다', async () => {
    // given
    vi.stubEnv('DEEPGRAM_TTS_API_KEY', 'deepgram-tts-key');
    const fetchMock = vi.fn<
      (url: string, init: RequestInit) => Promise<Response>
    >(async () => new Response('mp3-bytes', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    // when
    const res = await POST(ttsRequest(deepgramBody));

    // then
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.deepgram.com/v1/speak?model=aura-2-orpheus-en&encoding=mp3',
    );
    expect(init.headers).toMatchObject({
      Authorization: 'Token deepgram-tts-key',
    });
    expect(JSON.parse(init.body as string)).toEqual({ text: 'Hello' });
  });

  it('DEEPGRAM_TTS_API_KEY가 없으면 Deepgram 음성은 500을 돌려준다', async () => {
    vi.stubEnv('DEEPGRAM_TTS_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(ttsRequest(deepgramBody));

    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aura-2 음성이 아니면 Deepgram 합성을 부르지 않고 400을 돌려준다', async () => {
    vi.stubEnv('DEEPGRAM_TTS_API_KEY', 'deepgram-tts-key');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(ttsRequest({ ...deepgramBody, voice: 'nova-3' }));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Kokoro 모델(hexgrad/kokoro-82m)도 허용한다', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'real-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('mp3-bytes', { status: 200 })),
    );

    const res = await POST(
      ttsRequest({
        input: 'Hello',
        model: 'hexgrad/kokoro-82m',
        voice: 'af_heart',
      }),
    );

    expect(res.status).toBe(200);
  });

  it('허용 목록에 없는 model이면 400을 돌려주고 합성을 부르지 않는다', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'real-key');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(
      ttsRequest({ ...validBody, model: 'openai/gpt-4o' }),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('OpenRouter 합성이 실패하면 그 상태 코드를 그대로 돌려주고 Sentry에 보고한다', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'real-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 429,
        text: async () => 'rate limited',
      })),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST(ttsRequest(validBody));

    expect(res.status).toBe(429);
    expect(reportErrorMock).toHaveBeenCalledWith(expect.any(Error), {
      status: 429,
      detail: 'rate limited',
    });
  });

  it('합성이 성공하면 오디오를 audio/mpeg로 돌려준다', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'real-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('mp3-bytes', { status: 200 })),
    );

    const res = await POST(ttsRequest(validBody));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(await res.text()).toBe('mp3-bytes');
  });

  it('문장별로 이어 붙은 MP3가 오면 길이 정보가 맞는 한 스트림으로 합쳐 돌려준다', async () => {
    // given — 정보 프레임이 둘 붙은 업스트림 응답
    vi.stubEnv('OPENROUTER_API_KEY', 'real-key');
    const frame = (tag: string) => {
      const bytes = new Uint8Array(192);
      bytes.set([0xff, 0xf3, 0x84, 0xc0]);
      bytes.set(new TextEncoder().encode(tag), 13);
      return bytes;
    };
    const upstream = new Uint8Array(192 * 4);
    upstream.set(frame('Xing'), 0);
    upstream.set(frame(''), 192);
    upstream.set(frame('Xing'), 384);
    upstream.set(frame(''), 576);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(upstream, { status: 200 })),
    );

    // when
    const res = await POST(ttsRequest(validBody));

    // then — 뒤 정보 프레임 하나가 빠진다
    expect((await res.arrayBuffer()).byteLength).toBe(192 * 3);
  });
});
