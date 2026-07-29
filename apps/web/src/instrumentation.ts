// Next 서버 계측 진입점 — 서버 런타임에서 Sentry를 초기화하고 서버 요청 에러를 캡처한다
import * as Sentry from '@sentry/nextjs';

import { sentryInitOptions } from '@/shared/monitoring/sentry-options';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init(sentryInitOptions);
  }
}

export const onRequestError = Sentry.captureRequestError;
