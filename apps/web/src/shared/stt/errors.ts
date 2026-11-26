// STT 에러 타입 — 마이크 권한 거부만 별도 클래스로 구분해, 소비 지점이 문자열 매칭 없이 안내를 띄운다
export class MicPermissionDeniedError extends Error {
  constructor() {
    super('마이크 권한이 거부되었습니다.');
    this.name = 'MicPermissionDeniedError';
  }
}

// 세션 도중 인식 실패 — 연결 실패와 도중 끊김을 구분해 계측한다
export type SttErrorReason = 'connect_failed' | 'closed';

// 소켓이 끝난 순간의 기록 — 받아 적은 말을 살리고, 끊긴 원인(화면 숨김·서버 종료·네트워크)을 가르는 데 쓴다
export interface SttSocketEnd {
  transcript: string; // 끊기기 전까지 확정된 글자 — 확정 전 말은 끊기면서 사라진다
  closeCode: number | null; // 소켓 종료 코드(1006 비정상 끊김, 1011 서버 오류 등) — 오류 뒤 닫힘이 끝내 안 오면 null
  aliveMs: number; // 연결이 열린 뒤 끝나기까지 — 열리기 전 실패면 0
  wasHidden: boolean; // 듣는 동안 화면이 한 번이라도 숨겨졌는가 — 돌아온 뒤에 끊겨도 원인을 가를 수 있게
}

export class SttError extends Error {
  constructor(
    message: string,
    readonly reason: SttErrorReason,
    readonly detail: SttSocketEnd | null = null,
  ) {
    super(message);
    this.name = 'SttError';
  }
}

export const isMicPermissionDeniedError = (
  error: unknown,
): error is MicPermissionDeniedError =>
  error instanceof MicPermissionDeniedError;
