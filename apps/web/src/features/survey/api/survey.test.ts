import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { submitSurvey } from './survey';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('submitSurvey', () => {
  it('저장되면 saved를 돌려주고, 유저 id·이메일·답변을 한 줄로 보낸다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));

    const result = await submitSurvey(
      { userId: 7, email: 'a@b.c' },
      { a: 'x' },
    );

    expect(result).toBe('saved');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/survey_responses');
    expect(JSON.parse(init.body)).toEqual({
      user_id: 7,
      email: 'a@b.c',
      answers: { a: 'x' },
    });
    expect(init.headers.apikey).toBe('anon-key');
  });

  it('이미 같은 유저의 응답이 있으면(409) duplicate를 돌려준다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 409 }));

    await expect(submitSurvey({ userId: 7, email: null }, {})).resolves.toBe(
      'duplicate',
    );
  });

  it('그 밖의 실패 응답이면 에러를 던진다', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(
      submitSurvey({ userId: 7, email: null }, {}),
    ).rejects.toThrow();
  });

  it('슈퍼베이스 설정이 없으면 요청하지 않고 에러를 던진다', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');

    await expect(
      submitSurvey({ userId: 7, email: null }, {}),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
