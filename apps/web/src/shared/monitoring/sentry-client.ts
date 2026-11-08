// Sentry 브라우저 초기화 본체 — instrumentation-client가 따로 받아 부른다. 랜딩에선 첫 화면 뒤에 받도록 SDK를 여기 한 곳에만 묶는다
import {
  addIntegration,
  captureException,
  captureRouterTransitionStart,
  init,
  setTags,
} from '@sentry/nextjs';

import { getNativeContext } from '@/shared/bridge/native-context';
import { localeFromPath } from '@/shared/i18n/locale';

import { sentryInitOptions } from './sentry-options';

export { captureException, captureRouterTransitionStart };

/** 클라이언트 예외 수집을 켠다. DSN이 없으면(로컬 기본) 비활성 */
export const startSentry = () => {
  init({
    ...sentryInitOptions,
    // 리플레이는 에러 세션만 — 평소엔 버퍼에만 녹화하고 에러가 나면 직전 구간을 첨부한다
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });

  // 리플레이 녹화 모듈은 크다 — 앱 화면에서만 따로 받아 붙이고, 첫 화면 속도가 중요한 랜딩(/ko·/ja)에선 받지 않는다
  if (!localeFromPath(window.location.pathname)) {
    void import('@sentry/nextjs').then(({ replayIntegration }) =>
      addIntegration(replayIntegration()),
    );
  }

  // 이슈 필터링용 태그 — 앰플리튜드 공통 속성과 같은 어휘를 쓴다 (웹 배포 버전은 Sentry release가 대신한다)
  const native = getNativeContext();
  setTags({
    surface: native ? 'app' : 'browser',
    platform: native?.platform ?? 'web',
    ...(native && { app_version: native.appVersion }),
    ...(native?.buildNumber && { build_number: native.buildNumber }),
  });
};
