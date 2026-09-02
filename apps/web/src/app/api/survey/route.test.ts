// 설문 저장 라우트 — 설정 부재·인증·백엔드 확인·슈퍼베이스 응답 갈림길 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@/shared/monitoring/report', () => ({ reportError: vi.fn() }));

const token = `h.${Buffer.from(JSON.stringify({ sub: '7' })).toString('base64url')}.s`;

const surveyRequest = (body: unknown, authorization?: string) =>
  new Request('http://localhost/api/survey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorization && { Authorization: authorization }),
    },
    body: JSON.stringify(body),
  });

const fetchMock = vi.fn();
// 첫 호출은 백엔드 토큰 확인, 둘째는 슈퍼베이스 insert
const backendThenSupabase = (verifyStatus: number, insertStatus: number) =>
  fetchMock
    .mockResolvedValueOnce(new Response(null, { status: verifyStatus }))
    .mockResolvedValueOnce(new Response(null, { status: insertStatus }));

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'secret');
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.example.com');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('POST /api/survey', () => {
  it('슈퍼베이스 설정이 없으면 500을 돌려준다', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '');

    const res = await POST(surveyRequest({ answers: {} }, `Bearer ${token}`));

    expect(res.status).toBe(500);
  });

  it('토큰이 없거나 유저 id를 못 읽으면 401을 돌려주고 아무 데도 묻지 않는다', async () => {
    const noToken = await POST(surveyRequest({ answers: {} }));
    const badToken = await POST(
      surveyRequest({ answers: {} }, 'Bearer not-a-jwt'),
    );

    expect(noToken.status).toBe(401);
    expect(badToken.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('백엔드가 토큰을 거절하면(401) 401을 돌려주고 저장하지 않는다', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    const res = await POST(surveyRequest({ answers: {} }, `Bearer ${token}`));

    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('토큰이 확인되면 토큰의 유저 id로 저장하고 saved를 돌려준다', async () => {
    backendThenSupabase(200, 201);

    const res = await POST(
      surveyRequest(
        { email: 'a@b.c', answers: { satisfaction: 4 } },
        `Bearer ${token}`,
      ),
    );

    expect(await res.json()).toEqual({
      success: true,
      data: { result: 'saved' },
    });
    const [verifyUrl, verifyInit] = fetchMock.mock.calls[0];
    expect(verifyUrl).toBe('https://api.example.com/api/v1/me/learning-level');
    expect(verifyInit.headers.Authorization).toBe(`Bearer ${token}`);
    const [insertUrl, insertInit] = fetchMock.mock.calls[1];
    expect(insertUrl).toBe(
      'https://example.supabase.co/rest/v1/survey_responses',
    );
    expect(insertInit.headers.apikey).toBe('secret');
    expect(JSON.parse(insertInit.body)).toEqual({
      user_id: 7,
      email: 'a@b.c',
      answers: { satisfaction: 4 },
    });
  });

  it('이미 응답한 유저면(409) duplicate를 돌려준다', async () => {
    backendThenSupabase(200, 409);

    const res = await POST(surveyRequest({ answers: {} }, `Bearer ${token}`));

    expect(await res.json()).toEqual({
      success: true,
      data: { result: 'duplicate' },
    });
  });

  it('answers가 없으면 400을 돌려주고 백엔드에 묻지 않는다', async () => {
    const res = await POST(
      surveyRequest({ email: 'a@b.c' }, `Bearer ${token}`),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('백엔드에 닿지 못하면(fetch 실패) 502를 돌려주고 저장하지 않는다', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'));

    const res = await POST(surveyRequest({ answers: {} }, `Bearer ${token}`));

    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('슈퍼베이스에 닿지 못하면(fetch 실패) 502를 돌려준다', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockRejectedValueOnce(new Error('network'));

    const res = await POST(surveyRequest({ answers: {} }, `Bearer ${token}`));

    expect(res.status).toBe(502);
  });

  it('슈퍼베이스가 실패하면 502를 돌려준다', async () => {
    backendThenSupabase(200, 500);

    const res = await POST(surveyRequest({ answers: {} }, `Bearer ${token}`));

    expect(res.status).toBe(502);
  });
});
