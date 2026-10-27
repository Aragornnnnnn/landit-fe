// 소셜 로그인 요청 — 신규 가입이면 백엔드가 서비스 언어를 고를 수 있게 기기 선호 언어 목록 전체를 보낸다
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { socialLogin } from './social-login';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('socialLogin', () => {
  it('Accept-Language에 화면 언어가 아니라 기기 선호 언어 목록을 우선순위대로 싣는다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: {} }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([
      'en-US',
      'ja-JP',
      'ko',
    ]);
    document.documentElement.lang = 'ko';

    await socialLogin('google', 'id-token', 'nonce');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Accept-Language']).toBe('en-US,ja-JP;q=0.9,ko;q=0.8');
  });
});
