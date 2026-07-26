// 백엔드 API 실패를 구조로 보존하는 에러 — 모니터링 태그(endpoint·status·code)의 원천
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
