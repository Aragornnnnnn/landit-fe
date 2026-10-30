// 설문 저장 라우트 — 설정 부재·인증·백엔드 확인·슈퍼베이스 응답 갈림길 검증
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@/shared/monitoring/report', () => ({ reportError: vi.fn() }));

const RESPONSE_ID = '3f0b7c2e-9a1d-4e5f-8b6a-1c2d3e4f5a6b';
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
    // 일반 설문은 종류를 싣지 않는다 — survey 칸을 더하는 SQL보다 배포가 먼저여도 저장이 깨지지 않게(기본값 general)
    expect(JSON.parse(insertInit.body)).toEqual({
      user_id: 7,
      email: 'a@b.c',
      answers: { satisfaction: 4 },
    });
  });

  it('결제자 설문이면 어느 설문인지 함께 저장한다', async () => {
    backendThenSupabase(200, 201);

    await POST(
      surveyRequest(
        {
          survey: 'paid',
          answers: {
            premium_reason: '환급받을 수 있어서',
            disappointment: '느려요',
            channel: '지인 추천',
          },
        },
        `Bearer ${token}`,
      ),
    );

    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      survey: 'paid',
    });
  });

  it('결제자 설문에서 필수 주관식이 비어 있으면 400을 돌려주고 백엔드에 묻지 않는다', async () => {
    const res = await POST(
      surveyRequest(
        {
          survey: 'paid',
          answers: { channel: '지인 추천', disappointment: '느려요' },
        },
        `Bearer ${token}`,
      ),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('응답 번호가 있으면 그 번호의 응답을 덮어써 저장한다', async () => {
    backendThenSupabase(200, 201);

    await POST(
      surveyRequest(
        {
          survey: 'paid',
          responseId: RESPONSE_ID,
          completed: false,
          answers: { premium_reason: '환급받을 수 있어서' },
        },
        `Bearer ${token}`,
      ),
    );

    const [insertUrl, insertInit] = fetchMock.mock.calls[1];
    expect(insertUrl).toBe(
      'https://example.supabase.co/rest/v1/survey_responses?on_conflict=response_id',
    );
    expect(insertInit.headers.Prefer).toContain('resolution=merge-duplicates');
    expect(JSON.parse(insertInit.body)).toMatchObject({
      response_id: RESPONSE_ID,
      completed: false,
    });
  });

  it('중간 저장(완료 전)은 필수 답이 비어 있어도 저장한다', async () => {
    backendThenSupabase(200, 201);

    const res = await POST(
      surveyRequest(
        {
          survey: 'paid',
          responseId: RESPONSE_ID,
          completed: false,
          answers: {},
        },
        `Bearer ${token}`,
      ),
    );

    expect(res.status).toBe(200);
  });

  it('응답 번호 모양이 틀리면 400을 돌려주고 백엔드에 묻지 않는다', async () => {
    const res = await POST(
      surveyRequest(
        { responseId: 'not-a-uuid', completed: false, answers: {} },
        `Bearer ${token}`,
      ),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('모르는 설문 종류면 400을 돌려주고 백엔드에 묻지 않는다', async () => {
    const res = await POST(
      surveyRequest({ survey: 'unknown', answers: {} }, `Bearer ${token}`),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('저장소가 겹친다며 거절하면(409) 502로 알린다', async () => {
    // 같은 사람의 두 번째 응답도 새 행으로 쌓이므로 409는 저장소 설정이 틀어졌다는 뜻이다
    backendThenSupabase(200, 409);

    const res = await POST(surveyRequest({ answers: {} }, `Bearer ${token}`));

    expect(res.status).toBe(502);
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

  it.each([
    ['중첩 객체', { q: { nested: true } }],
    ['숫자 아닌 배열', { q: [1, 2] }],
    ['너무 긴 글', { q: 'a'.repeat(1001) }],
  ])(
    '답변 값이 약속한 모양이 아니면(%s) 400을 돌려주고 저장하지 않는다',
    async (_, answers) => {
      const res = await POST(surveyRequest({ answers }, `Bearer ${token}`));

      expect(res.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

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
