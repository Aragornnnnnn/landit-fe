// STT 에러 타입 — 마이크 권한 거부만 별도 클래스로 구분해, 소비 지점이 문자열 매칭 없이 안내를 띄운다
export class MicPermissionDeniedError extends Error {
  constructor() {
    super('마이크 권한이 거부되었습니다.');
    this.name = 'MicPermissionDeniedError';
  }
}

// 세션 도중 인식 실패 — 연결 실패와 도중 끊김을 구분해 계측한다
export type SttErrorReason = 'connect_failed' | 'closed';

export class SttError extends Error {
  constructor(
    message: string,
    readonly reason: SttErrorReason,
  ) {
    super(message);
    this.name = 'SttError';
  }
}

export const isMicPermissionDeniedError = (
  error: unknown,
): error is MicPermissionDeniedError =>
  error instanceof MicPermissionDeniedError;
