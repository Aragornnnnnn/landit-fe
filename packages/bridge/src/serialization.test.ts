// 브릿지 메시지 파싱·직렬화 검증 — 특히 optional 필드는 구버전 앱 셸과의 하위호환 약속이다
import { describe, expect, it } from 'vitest';

import {
  parseNativeToWebMessage,
  parseWebToNativeMessage,
  serializeBridgeMessage,
} from './serialization';

describe('parseNativeToWebMessage', () => {
  it('직렬화한 메시지를 그대로 되돌린다 (round-trip)', () => {
    const message = {
      type: 'SOCIAL_LOGIN_SUCCESS',
      provider: 'apple',
      idToken: 'token',
      nonce: 'nonce',
      nickname: '김준서',
    } as const;

    expect(parseNativeToWebMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );
  });

  it('구버전 셸 메시지도 허용한다 — nickname·cancelled 없는 메시지 (하위호환)', () => {
    expect(
      parseNativeToWebMessage(
        JSON.stringify({
          type: 'SOCIAL_LOGIN_SUCCESS',
          provider: 'kakao',
          idToken: 'token',
          nonce: 'nonce',
        }),
      ),
    ).not.toBeNull();

    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_ERROR', message: '실패' }),
      ),
    ).not.toBeNull();
  });

  it('규격 밖 메시지는 null을 돌려준다', () => {
    // 필수 필드 누락
    expect(
      parseNativeToWebMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_SUCCESS', provider: 'apple' }),
      ),
    ).toBeNull();
    // 모르는 type
    expect(
      parseNativeToWebMessage(JSON.stringify({ type: 'UNKNOWN' })),
    ).toBeNull();
    // JSON이 아닌 문자열, 문자열이 아닌 값
    expect(parseNativeToWebMessage('not-json')).toBeNull();
    expect(parseNativeToWebMessage(123)).toBeNull();
  });
});

describe('parseWebToNativeMessage', () => {
  it('지원하는 provider의 로그인 요청만 허용한다', () => {
    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_REQUEST', provider: 'google' }),
      ),
    ).toEqual({ type: 'SOCIAL_LOGIN_REQUEST', provider: 'google' });

    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'SOCIAL_LOGIN_REQUEST', provider: 'naver' }),
      ),
    ).toBeNull();
  });

  it('정의된 패턴의 햅틱 요청만 허용한다', () => {
    const message = { type: 'HAPTIC', pattern: 'success' } as const;
    expect(parseWebToNativeMessage(serializeBridgeMessage(message))).toEqual(
      message,
    );

    // 규격 밖 패턴은 버린다
    expect(
      parseWebToNativeMessage(
        JSON.stringify({ type: 'HAPTIC', pattern: 'explode' }),
      ),
    ).toBeNull();
  });
});
