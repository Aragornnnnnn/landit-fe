// 서버·클라이언트가 공유하는 Sentry 초기화 옵션
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// 이름에 이 조각이 들어간 헤더·쿼리 키는 값을 [Filtered]로 가린다 — 프록시 경유 정보·IP·사용자 식별 헤더
const SENSITIVE_KEYS = {
  deny: ['forwarded', '-ip', 'remote-', 'via', '-user'],
};

/**
 * Sentry.init 공통 옵션.
 *
 * dataCollection — v11부터 비워 두면 쿠키·요청 본문·IP까지 수집하므로 v10 기본 범위를 명시한다.
 * 쿠키엔 인증 토큰, TTS/STT 요청 본문엔 발화 원문이 있다.
 * - userInfo: 요청에서 IP 등 user.* 정보를 자동으로 채울지 — 끈다
 * - cookies: 요청 쿠키를 붙일지 — 끈다
 * - httpHeaders: 요청·응답 헤더를 붙이되 SENSITIVE_KEYS에 걸리는 값은 가린다
 * - httpBodies: 붙일 요청·응답 본문 종류 — 빈 배열이라 본문은 붙이지 않는다
 * - urlQueryParams: URL 쿼리 파라미터를 붙이되 SENSITIVE_KEYS에 걸리는 값은 가린다
 * - genAI: AI SDK 연동의 프롬프트·응답 — 끈다 (현재 연동 없음)
 * - databaseQueryData: DB 쿼리의 바인딩 값·결과 — 끈다 (현재 DB 없음)
 * - queues: 큐 작업 인자 — 끈다 (현재 큐 없음)
 * - graphQL: GraphQL 쿼리 문서·변수 — 끈다 (현재 GraphQL 없음)
 *
 * 안 적은 stackFrameVariables(스택 프레임 지역 변수)는 v10과 같이 켜져 있고, frameContextLines(에러 주변 코드 줄 수)는 7에서 5로 줄었다.
 * 토큰·비밀번호처럼 이름으로 알아볼 수 있는 값은 이 설정과 별개로 Sentry가 항상 가린다.
 */
export const sentryInitOptions = {
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: SENSITIVE_KEYS, response: SENSITIVE_KEYS },
    httpBodies: [],
    urlQueryParams: SENSITIVE_KEYS,
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    graphQL: { document: false, variables: false },
  },
};
