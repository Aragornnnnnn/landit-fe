// 소셜 로그인 공통 에러 헬퍼 검증 (jest-expo 파이프라인 확인용 예시)
import { assertIdToken, hasErrorCode, SocialLoginError } from './errors';

describe('assertIdToken', () => {
  it('id_token이 있으면 그대로 돌려준다', () => {
    expect(assertIdToken('token-value')).toBe('token-value');
  });

  it('id_token이 없으면 SocialLoginError를 던진다', () => {
    expect(() => assertIdToken(undefined)).toThrow(SocialLoginError);
  });
});

describe('SocialLoginError', () => {
  it('cancelled 기본값은 false다', () => {
    expect(new SocialLoginError('실패').cancelled).toBe(false);
    expect(new SocialLoginError('취소', true).cancelled).toBe(true);
  });
});

describe('hasErrorCode', () => {
  it('code 필드가 일치할 때만 true를 돌려준다', () => {
    expect(
      hasErrorCode({ code: 'ERR_REQUEST_CANCELED' }, 'ERR_REQUEST_CANCELED'),
    ).toBe(true);
    expect(hasErrorCode({ code: 'OTHER' }, 'ERR_REQUEST_CANCELED')).toBe(false);
    expect(hasErrorCode(null, 'ERR_REQUEST_CANCELED')).toBe(false);
    expect(hasErrorCode('문자열 에러', 'ERR_REQUEST_CANCELED')).toBe(false);
  });
});
