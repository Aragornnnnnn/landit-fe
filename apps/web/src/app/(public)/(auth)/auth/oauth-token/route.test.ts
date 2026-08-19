// code→id_token 교환 라우트 — 필드 누락·제공자 분기·키 부재·성공 응답 갈림길 검증
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const makeRequest = (body: unknown) =>
  new Request('http://localhost/auth/oauth-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /auth/oauth-token', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('provider·code·redirectUri 중 하나라도 없으면 400을 돌려준다', async () => {
    const res = await POST(makeRequest({ provider: 'google', code: 'c' }));

    expect(res.status).toBe(400);
  });

  it('지원하지 않는 제공자면 400을 돌려준다', async () => {
    const res = await POST(
      makeRequest({ provider: 'naver', code: 'c', redirectUri: 'http://x' }),
    );

    expect(res.status).toBe(400);
  });

  it('구글은 codeVerifier가 없으면 400을 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'g-client');

    const res = await POST(
      makeRequest({ provider: 'google', code: 'c', redirectUri: 'http://x' }),
    );

    expect(res.status).toBe(400);
  });

  it('카카오는 REST API 키가 없으면 400을 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_KAKAO_REST_API_KEY', '');

    const res = await POST(
      makeRequest({ provider: 'kakao', code: 'c', redirectUri: 'http://x' }),
    );

    expect(res.status).toBe(400);
  });

  it('교환에 성공하면 응답의 id_token을 idToken으로 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_KAKAO_REST_API_KEY', 'kakao-rest');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ id_token: 'the-id-token' }),
      })),
    );

    const res = await POST(
      makeRequest({ provider: 'kakao', code: 'c', redirectUri: 'http://x' }),
    );
    const body = await res.json();

    expect(body).toEqual({ idToken: 'the-id-token' });
  });

  it('제공자가 error를 내려주면 그 사유로 400을 돌려준다', async () => {
    vi.stubEnv('NEXT_PUBLIC_KAKAO_REST_API_KEY', 'kakao-rest');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error_description: 'invalid grant' }),
      })),
    );

    const res = await POST(
      makeRequest({ provider: 'kakao', code: 'c', redirectUri: 'http://x' }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('invalid grant');
  });
});
