// 소셜 로그인 공통 에러 타입과 id_token 검증 헬퍼
export class SocialLoginError extends Error {
  constructor(
    message: string,
    // 사용자가 로그인 도중 명시적으로 취소한 경우 — 웹은 이때 에러 배너를 띄우지 않는다
    public cancelled = false,
  ) {
    super(message);
  }
}

export function assertIdToken(idToken: string | undefined): string {
  if (!idToken) {
    throw new SocialLoginError('id_token을 받지 못했어요.');
  }
  return idToken;
}

// provider SDK가 던지는 에러 객체의 code 필드를 검사한다 (취소 여부 판별 등에 공통으로 쓰인다)
export function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}
