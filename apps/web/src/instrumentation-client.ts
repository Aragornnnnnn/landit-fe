// Sentry 브라우저 초기화 — 클라이언트 예외를 수집한다. DSN이 없으면(로컬 기본) 비활성
import * as Sentry from '@sentry/nextjs';

import { getNativeContext } from '@/shared/bridge/native-context';
import { sentryInitOptions } from '@/shared/monitoring/sentry-options';

Sentry.init({
  ...sentryInitOptions,
  // 리플레이는 에러 세션만 — 평소엔 버퍼에만 녹화하고 에러가 나면 직전 구간을 첨부한다
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// 이슈 필터링용 태그 — 앰플리튜드 공통 속성과 같은 어휘를 쓴다 (웹 배포 버전은 Sentry release가 대신한다)
const native = getNativeContext();
Sentry.setTags({
  surface: native ? 'app' : 'browser',
  platform: native?.platform ?? 'web',
  ...(native && { app_version: native.appVersion }),
  ...(native?.buildNumber && { build_number: native.buildNumber }),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
