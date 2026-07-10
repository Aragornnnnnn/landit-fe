// parseApiResponse — 백엔드 공통 응답 포맷 파싱 검증
import { describe, expect, it } from 'vitest';

import { parseApiResponse } from './parse';

function fakeResponse(body: unknown): Response {
  return { json: async () => body } as Response;
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

  it('실패 응답에 메시지가 없으면 기본 문구로 에러를 던진다', async () => {
    const response = fakeResponse({ success: false });

    await expect(parseApiResponse(response)).rejects.toThrow(
      '서버 오류가 발생했어요.',
    );
  });
});
