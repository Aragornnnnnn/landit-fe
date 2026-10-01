// api 클라이언트 분기 검증 — 본문 직렬화(FormData·JSON)와 앱을 켠 직후의 토큰 선발급
import { afterEach, describe, expect, it, vi } from 'vitest';

import { REFRESH_PATH } from '@/shared/auth/api/refresh';
import { useAuthStore } from '@/shared/auth/auth-store';

import { api } from './client';

const okResponse = () =>
  new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });

const refreshResponse = (accessToken: string) =>
  new Response(
    JSON.stringify({
      success: true,
      data: {
        tokenType: 'Bearer',
        accessToken,
        accessTokenExpiresIn: 3600,
        refreshToken: 'rotated-refresh',
        refreshTokenExpiresIn: 86400,
      },
    }),
    { status: 200 },
  );

const member = { userId: 1, nickname: null, email: null, provider: 'KAKAO' };

// 경로별로 응답을 고르는 가짜 fetch — 재발급 요청과 일반 요청을 구분해 센다
const fakeFetch = () =>
  vi.fn<(path: string, init: RequestInit) => Promise<Response>>((path) =>
    Promise.resolve(
      path === REFRESH_PATH ? refreshResponse('fresh-access') : okResponse(),
    ),
  );

const authHeader = (init: RequestInit) =>
  new Headers(init.headers).get('Authorization');

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    member: null,
  });
});

describe('api.post', () => {
  it('body가 FormData면 Content-Type 없이 원본 그대로 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal('fetch', fetchMock);
    const form = new FormData();

    await api.post('/api/v1/test', form);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(new Headers(init.headers).has('Content-Type')).toBe(false);
  });

  it('일반 객체 body는 JSON으로 직렬화하고 Content-Type을 붙인다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal('fetch', fetchMock);

    await api.post('/api/v1/test', { a: 1 });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect(new Headers(init.headers).get('Content-Type')).toBe(
      'application/json',
    );
  });
});

describe('앱을 켠 직후 (메모리에 accessToken 없음)', () => {
  it('refreshToken이 있으면 재발급부터 받고 새 토큰을 붙여 한 번에 보낸다', async () => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: 'stored-refresh',
      member,
    });
    const fetchMock = fakeFetch();
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/api/v1/test');

    const paths = fetchMock.mock.calls.map(([path]) => path);
    expect(paths).toEqual([REFRESH_PATH, '/api/v1/test']);
    expect(authHeader(fetchMock.mock.calls[1][1])).toBe('Bearer fresh-access');
  });

  it('동시에 여러 요청이 나가도 재발급은 한 번만 보낸다', async () => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: 'stored-refresh',
      member,
    });
    const fetchMock = fakeFetch();
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([
      api.get('/api/v1/a'),
      api.get('/api/v1/b'),
      api.get('/api/v1/c'),
    ]);

    const refreshCalls = fetchMock.mock.calls.filter(
      ([path]) => path === REFRESH_PATH,
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('선발급이 실패하면 401에서 재발급을 다시 보내지 않고 세션을 끝낸다', async () => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: 'expired-refresh',
      member,
    });
    const fetchMock = vi.fn<
      (path: string, init: RequestInit) => Promise<Response>
    >(() => Promise.resolve(new Response(null, { status: 401 })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/api/v1/test')).rejects.toThrow('세션이 만료됐어요');

    const refreshCalls = fetchMock.mock.calls.filter(
      ([path]) => path === REFRESH_PATH,
    );
    expect(refreshCalls).toHaveLength(1);
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('refreshToken도 없으면(비로그인) 재발급 없이 토큰 없이 보낸다', async () => {
    const fetchMock = fakeFetch();
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/api/v1/test');

    const paths = fetchMock.mock.calls.map(([path]) => path);
    expect(paths).toEqual(['/api/v1/test']);
    expect(authHeader(fetchMock.mock.calls[0][1])).toBeNull();
  });
});

describe('api.getBlob', () => {
  it('성공하면 JSON으로 풀지 않고 받은 바이트를 그대로 준다', async () => {
    useAuthStore.setState({
      accessToken: 'access',
      refreshToken: null,
      member,
    });
    const fetchMock = vi.fn<
      (path: string, init: RequestInit) => Promise<Response>
    >(() =>
      Promise.resolve(
        new Response('jpeg', {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const blob = await api.getBlob('/api/v1/mailbox/feedbacks/1/attachments/2');

    expect(blob.type).toBe('image/jpeg');
    expect(await blob.text()).toBe('jpeg');
    expect(authHeader(fetchMock.mock.calls[0][1])).toBe('Bearer access');
  });

  it('실패하면 서버가 준 상태로 ApiError를 던진다', async () => {
    useAuthStore.setState({
      accessToken: 'access',
      refreshToken: null,
      member,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        const response = new Response(
          JSON.stringify({
            success: false,
            error: { code: 'NOT_FOUND', message: '첨부를 찾을 수 없습니다.' },
          }),
          { status: 404 },
        );
        // 실제 응답처럼 주소를 달아 둔다 — 실패 파싱이 endpoint를 읽는다
        Object.defineProperty(response, 'url', {
          value: 'https://landit.im/api/v1/x',
        });
        return Promise.resolve(response);
      }),
    );

    await expect(api.getBlob('/api/v1/x')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
