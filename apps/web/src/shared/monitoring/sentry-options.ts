// 서버·클라이언트가 공유하는 Sentry 초기화 옵션
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// v11부터 미설정 시 쿠키·요청 본문·IP까지 수집하므로 v10 기본 범위를 명시한다 (쿠키엔 인증 토큰, 본문엔 발화 원문이 있다)
const SENSITIVE_KEYS = {
  deny: ['forwarded', '-ip', 'remote-', 'via', '-user'],
};

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
