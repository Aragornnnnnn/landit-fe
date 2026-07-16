'use client';

// 앰플리튜드 래퍼 — 이벤트 발화의 단일 통로. 키가 없으면 no-op으로 콘솔에만 남긴다 (dev/prod 프로젝트는 env 키로 분리)
import * as amplitude from '@amplitude/unified';
import type { EventName, EventProps } from '@landit/analytics';

import { getNativeContext } from '@/shared/bridge/native-context';

const getApiKey = () => process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

// dev 환경에서는 키가 있어도 어떤 이벤트를 쏘는지 콘솔로 확인할 수 있게 전역 로깅한다
const isDev = () => process.env.NODE_ENV === 'development';

// no-op(키 없음)·dev 환경 콘솔 로깅을 한곳에서 — 반환값은 SDK로 실제 전송할지 여부
const logAndShouldSend = (...args: unknown[]) => {
  const enabled = Boolean(getApiKey());
  // console.info — debug는 크롬 기본 레벨(Verbose 꺼짐)에서 숨겨져 안 보인다
  if (!enabled || isDev()) console.info('[analytics]', ...args);
  return enabled;
};

let initialized = false;

// 전 이벤트 공통 속성 — 셸이 주입한 네이티브 컨텍스트에서 온다 (LAN-156).
// 스크롤·탭마다 불리는 핫패스라 컨텍스트를 한 번만 읽고 surface도 여기서 파생한다
const baseProps = () => {
  const native = getNativeContext();
  // 웹 배포 버전 — Vercel이 빌드에 주입하는 커밋 SHA (로컬·미설정이면 생략)
  const webVersion = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  return {
    surface: native ? 'app' : 'browser',
    platform: native?.platform ?? 'web',
    ...(native && { app_version: native.appVersion }),
    ...(native?.buildNumber && { build_number: native.buildNumber }),
    ...(webVersion && { web_version: webVersion }),
  };
};

export const initAnalytics = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const apiKey = getApiKey();
  if (!apiKey) return;

  // 세션 리플레이는 초기 단계라 100% 수집. 오토캡처는 전부 끈다 — 커스텀 이벤트 53종으로 충분.
  // minIdLength: 백엔드 회원번호가 1~4자리라 앰플리튜드 기본 5자 제한에 걸려
  // "Invalid id length for user_id"(400)로 이벤트가 통째로 거절되던 것을 푼다
  amplitude.initAll(apiKey, {
    analytics: {
      minIdLength: 1,
      autocapture: false,
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

  if (!logAndShouldSend(event, payload)) return;
  amplitude.track(event, payload);
};

export const identifyUser = (
  userId: number,
  userProps: { provider: string },
) => {
  if (!logAndShouldSend('identify', userId, userProps)) return;
  amplitude.setUserId(String(userId));
  const identify = new amplitude.Identify();
  identify.set('provider', userProps.provider);
  amplitude.identify(identify);
};

// 로그아웃 시 익명 사용자로 리셋한다 — 최초 방문(익명) 상태에서는 호출하지 않는다
export const resetUser = () => {
  if (!logAndShouldSend('reset')) return;
  amplitude.reset();
};
