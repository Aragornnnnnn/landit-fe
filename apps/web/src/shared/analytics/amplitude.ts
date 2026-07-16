'use client';

// 앰플리튜드 래퍼 — 이벤트 발화의 단일 통로. 키가 없으면 no-op으로 console.debug만 남긴다 (dev/prod 프로젝트는 env 키로 분리)
import * as amplitude from '@amplitude/unified';
import type { EventName, EventProps } from '@landit/analytics';

import { getNativeContext, getSurface } from '@/shared/bridge/native-context';

const getApiKey = () => process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

// dev 환경에서는 키가 있어도 어떤 이벤트를 쏘는지 콘솔로 확인할 수 있게 전역 로깅한다
const isDev = () => process.env.NODE_ENV === 'development';

let initialized = false;

// 전 이벤트 공통 속성 — 셸이 주입한 네이티브 컨텍스트에서 온다 (LAN-156)
const baseProps = () => {
  const native = getNativeContext();
  return {
    surface: getSurface(),
    platform: native?.platform ?? 'web',
    ...(native && { app_version: native.appVersion }),
    ...(native?.buildNumber && { build_number: native.buildNumber }),
  };
};

export const initAnalytics = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const apiKey = getApiKey();
  if (!apiKey) return;

  // 세션 리플레이는 초기 단계라 100% 수집. 오토캡처는 커스텀 이벤트와 겹치지 않는 것만 —
  // pageViews는 커스텀 Page Viewed와 중복이라 끄고, elementInteractions는 계측 누락 안전망으로 켜둔다
  amplitude.initAll(apiKey, {
    analytics: {
      autocapture: {
        sessions: true,
        attribution: true,
        elementInteractions: true,
        pageViews: false,
        formInteractions: false,
        fileDownloads: false,
      },
    },
    sessionReplay: { sampleRate: 1 },
  });

  const identify = new amplitude.Identify();
  for (const [key, value] of Object.entries(baseProps())) {
    identify.set(key, value);
  }
  amplitude.identify(identify);
};

// 속성이 없는 이벤트(undefined)는 두 번째 인자 없이 호출한다
type TrackArgs<E extends EventName> = EventProps[E] extends undefined
  ? [event: E]
  : [event: E, props: EventProps[E]];

export const track = <E extends EventName>(...args: TrackArgs<E>) => {
  if (typeof window === 'undefined') return;

  const [event, props] = args;
  const payload = { ...baseProps(), ...props };

  if (!getApiKey()) {
    console.debug('[analytics]', event, payload);
    return;
  }
  if (isDev()) console.debug('[analytics]', event, payload);
  amplitude.track(event, payload);
};

export const identifyUser = (
  userId: number,
  userProps: { provider: string },
) => {
  if (!getApiKey()) {
    console.debug('[analytics] identify', userId, userProps);
    return;
  }
  if (isDev()) console.debug('[analytics] identify', userId, userProps);
  amplitude.setUserId(String(userId));
  const identify = new amplitude.Identify();
  identify.set('provider', userProps.provider);
  amplitude.identify(identify);
};

// 로그아웃 시 익명 사용자로 리셋한다 — 최초 방문(익명) 상태에서는 호출하지 않는다
export const resetUser = () => {
  if (!getApiKey()) {
    console.debug('[analytics] reset');
    return;
  }
  if (isDev()) console.debug('[analytics] reset');
  amplitude.reset();
};
