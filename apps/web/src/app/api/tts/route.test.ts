// TTS 프록시 라우트 — 키 부재·입력 누락·업스트림 실패·성공 스트림 갈림길 검증
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

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

  it('OpenRouter 합성이 실패하면 그 상태 코드를 그대로 돌려준다', async () => {
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
});
