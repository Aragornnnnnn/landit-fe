// PKCE·nonce용 crypto 유틸 검증 — hex 생성, base64url 인코딩, code_challenge 결정성
import { describe, expect, it } from 'vitest';

import {
  base64UrlEncode,
  createCodeChallenge,
  generateCodeVerifier,
  generateRandomHex,
} from './crypto';

describe('generateRandomHex', () => {
  it('바이트 길이의 2배 길이 hex 문자열을 만든다', () => {
    const hex = generateRandomHex(16);

    expect(hex).toHaveLength(32);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });
});

describe('base64UrlEncode', () => {
  it('url-safe 문자로 바꾸고 패딩(=)을 제거한다', () => {
    // given — 표준 base64에서 +, /, = 이 나오는 바이트열
    const bytes = new Uint8Array([251, 255, 190]); // 표준 base64: "+/++" 계열

    const encoded = base64UrlEncode(bytes);

    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe('createCodeChallenge', () => {
  it('같은 verifier면 항상 같은 challenge(S256)를 낸다', async () => {
    const a = await createCodeChallenge('test-verifier');
    const b = await createCodeChallenge('test-verifier');

    expect(a).toBe(b);
    expect(a).not.toMatch(/[+/=]/);
  });

  it('verifier가 다르면 challenge도 다르다', async () => {
    const a = await createCodeChallenge('verifier-one');
    const b = await createCodeChallenge('verifier-two');

    expect(a).not.toBe(b);
  });
});

describe('generateCodeVerifier', () => {
  it('매번 다른 url-safe 문자열을 낸다', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();

    expect(a).not.toBe(b);
    expect(a).not.toMatch(/[+/=]/);
  });
});
