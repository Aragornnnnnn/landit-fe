// 서버·클라이언트가 공유하는 Sentry 초기화 옵션
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const sentryInitOptions = {
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
};
