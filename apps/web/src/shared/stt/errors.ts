// STT 에러 타입 — 마이크 권한 거부만 별도 클래스로 구분해, 소비 지점이 문자열 매칭 없이 안내를 띄운다
export class MicPermissionDeniedError extends Error {
  constructor() {
    super('마이크 권한이 거부되었습니다.');
    this.name = 'MicPermissionDeniedError';
  }
}

export const isMicPermissionDeniedError = (
  error: unknown,
): error is MicPermissionDeniedError =>
  error instanceof MicPermissionDeniedError;
