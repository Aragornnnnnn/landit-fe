// api 클라이언트의 본문 직렬화 분기 검증 — FormData는 원본 그대로, 일반 객체는 JSON
import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from './client';

const okResponse = () =>
  new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

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
