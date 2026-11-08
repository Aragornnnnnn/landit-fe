// Sentry 브라우저 초기화 — 앱 화면은 바로, 랜딩(/ko·/ja)은 첫 화면을 다 받은 뒤 SDK를 받는다(압축 약 50KB가 첫 화면 그림과 대역을 다투지 않게). 받기 전 에러는 버퍼에 모았다가 넘긴다
import type { captureRouterTransitionStart } from '@sentry/nextjs';

import { localeFromPath } from '@/shared/i18n/locale';
import { afterPageLoadIdle } from '@/shared/lib/page-idle';
import { bufferEarlyErrors } from '@/shared/monitoring/early-errors';

type SentryClient = typeof import('@/shared/monitoring/sentry-client');

let sentry: SentryClient | null = null;
const flushEarlyErrors = bufferEarlyErrors(window);

const loadSentry = async () => {
  const client = await import('@/shared/monitoring/sentry-client');
  client.startSentry();
  sentry = client;
  flushEarlyErrors((error) => client.captureException(error));
};

if (localeFromPath(window.location.pathname)) afterPageLoadIdle(loadSentry);
else void loadSentry();

// SDK를 받기 전의 화면 이동은 건너뛴다
export const onRouterTransitionStart: typeof captureRouterTransitionStart = (
  ...args
) => sentry?.captureRouterTransitionStart(...args);
