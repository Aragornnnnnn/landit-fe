// 웹 소셜 로그인 순수 헬퍼 검증 — redirect URI 해석 분기, 구글 authorize URL 파라미터
import { describe, expect, it } from 'vitest';

import { buildGoogleAuthUrl, resolveRedirectUri } from './web-social-login';

describe('resolveRedirectUri', () => {
  it('설정값이 없으면 현재 origin 기반 콜백 경로를 쓴다', () => {
    const uri = resolveRedirectUri(
      undefined,
      'http://localhost:3000',
      'google',
    );

    expect(uri).toBe('http://localhost:3000/auth/google/callback');
  });

  it('설정값이 있으면 그대로 쓴다', () => {
    const configured = 'https://landit.im/auth/kakao/callback';

    const uri = resolveRedirectUri(
      configured,
      'http://localhost:3000',
      'kakao',
    );

    expect(uri).toBe(configured);
  });
});

describe('buildGoogleAuthUrl', () => {
  it('PKCE·nonce·state를 포함한 authorize URL을 만든다', () => {
    const url = new URL(
      buildGoogleAuthUrl({
        clientId: 'client-123',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        nonce: 'nonce-abc',
        state: 'state-xyz',
        codeChallenge: 'challenge-def',
      }),
    );
    const params = url.searchParams;

    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(params.get('response_type')).toBe('code');
    expect(params.get('client_id')).toBe('client-123');
    expect(params.get('nonce')).toBe('nonce-abc');
    expect(params.get('state')).toBe('state-xyz');
    expect(params.get('code_challenge')).toBe('challenge-def');
    expect(params.get('code_challenge_method')).toBe('S256');
    expect(params.get('scope')).toContain('openid');
  });
});
