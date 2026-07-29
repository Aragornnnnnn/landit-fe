// parseApiResponse — 백엔드 공통 응답 포맷 파싱 검증
import { describe, expect, it } from 'vitest';

import { ApiError } from './api-error';
import { parseApiResponse } from './parse';

// 실제 fetch Response처럼 status·url을 항상 갖게 한다 (성공 기본값 200)
function fakeResponse(body: unknown, status = 200): Response {
  return {
    status,
    url: 'https://landit.im/api/v1/test',
    json: async () => body,
  } as Response;
}

describe('parseApiResponse', () => {
  it('성공 응답이면 data를 그대로 돌려준다', async () => {
    const response = fakeResponse({ success: true, data: { userId: 1 } });

    await expect(parseApiResponse(response)).resolves.toEqual({ userId: 1 });
  });

  it('실패 응답이면 서버가 준 메시지로 에러를 던진다', async () => {
    const response = fakeResponse({
      success: false,
      error: {
        code: 'OIDC_NONCE_MISMATCH',
        message: '검증 값이 일치하지 않습니다.',
      },
    });

    await expect(parseApiResponse(response)).rejects.toThrow(
      '검증 값이 일치하지 않습니다.',
    );
  });

  it('실패 응답에 메시지가 없으면 상태코드를 붙인 기본 문구로 에러를 던진다', async () => {
    const response = fakeResponse({ success: false }, 400);

    await expect(parseApiResponse(response)).rejects.toThrow(
      '서버 오류가 발생했어요. (400)',
    );
  });

  it('래퍼 없는 에러(스프링 기본 500 등)면 상태코드를 붙여 던진다', async () => {
    const response = {
      status: 500,
      url: 'https://landit.im/api/v1/test',
      json: async () => ({ status: 500, error: 'Internal Server Error' }),
    } as Response;

    await expect(parseApiResponse(response)).rejects.toThrow(
      '서버 오류가 발생했어요. (500)',
    );
  });

  it('실패는 상태·코드·엔드포인트를 보존한 ApiError로 던진다 — 모니터링 태그의 원천', async () => {
    const response = {
      status: 409,
      url: 'https://landit.im/api/v1/sessions/3/messages?foo=1',
      json: async () => ({
        success: false,
        error: { code: 'SESSION_ALREADY_ENDED', message: '끝난 세션이에요.' },
      }),
    } as unknown as Response;

    const thrown = await parseApiResponse(response).catch((e: unknown) => e);

    expect(thrown).toBeInstanceOf(ApiError);
    const apiError = thrown as ApiError;
    expect(apiError.status).toBe(409);
    expect(apiError.code).toBe('SESSION_ALREADY_ENDED');
    expect(apiError.endpoint).toBe('/api/v1/sessions/3/messages');
  });

  it('본문이 JSON이 아니어도 상태코드로 에러를 던진다', async () => {
    const response = {
      status: 502,
      url: 'https://landit.im/api/v1/test',
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response;

    await expect(parseApiResponse(response)).rejects.toThrow(
      '서버 오류가 발생했어요. (502)',
    );
  });
});
