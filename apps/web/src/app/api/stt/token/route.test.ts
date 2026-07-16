// STT 임시 토큰 라우트 — 키 부재·grant 실패·성공 응답 갈림길 검증
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

describe('POST /api/stt/token', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('DEEPGRAM_API_KEY가 없으면 500을 돌려준다', async () => {
    vi.stubEnv('DEEPGRAM_API_KEY', '');

    const res = await POST();

    expect(res.status).toBe(500);
  });

  it('Deepgram grant가 실패하면 502를 돌려준다', async () => {
    vi.stubEnv('DEEPGRAM_API_KEY', 'real-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, text: async () => 'unauthorized' })),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await POST();

    expect(res.status).toBe(502);
  });

  it('grant가 성공하면 임시 토큰만 돌려주고 원본 키는 응답에 없다', async () => {
    vi.stubEnv('DEEPGRAM_API_KEY', 'real-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: 'temp-token' }),
      })),
    );

    const res = await POST();
    const body = await res.json();

    expect(body).toEqual({ token: 'temp-token' });
    expect(JSON.stringify(body)).not.toContain('real-key');
  });
});
