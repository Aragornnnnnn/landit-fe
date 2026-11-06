'use client';

// 랜딩 계측 — 첫 화면이 다 그려진 뒤 가벼운 앰플리튜드 SDK를 받아 방문을 남기고, 다운로드 버튼 누름과 처음 떠날 때 머문 시간을 남긴다. 유입 경로·UTM은 SDK가 자동으로 수집한다
import { useEffect } from 'react';
import { EVENTS, type EventProps } from '@landit/analytics';
import { usePathname } from 'next/navigation';

import {
  downloadClickOf,
  dwellSeconds,
  landingPageOf,
} from '../_model/landing-analytics';

type LandingEvent =
  | typeof EVENTS.LANDING_VIEWED
  | typeof EVENTS.LANDING_DOWNLOAD_CLICKED
  | typeof EVENTS.LANDING_EXITED;

type Sdk = typeof import('@amplitude/analytics-browser');

let sdkPromise: Promise<Sdk | null> | null = null;

// 앱과 같은 프로젝트 키를 쓰되, 세션 리플레이가 없는 가벼운 SDK만 받는다. 떠나는 순간에도 전송되게 beacon으로 보낸다
const loadSdk = () =>
  (sdkPromise ??= (async () => {
    const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
    if (!apiKey) return null;
    const sdk = await import('@amplitude/analytics-browser');
    sdk.init(apiKey, {
      transport: 'beacon',
      autocapture: {
        attribution: true,
        sessions: true,
        pageViews: false,
        formInteractions: false,
        fileDownloads: false,
        elementInteractions: false,
      },
    });
    return sdk;
  })());

const send = <E extends LandingEvent>(event: E, props: EventProps[E]) => {
  if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
    if (process.env.NODE_ENV === 'development')
      console.log('[analytics]', event, props);
    return;
  }
  void loadSdk().then((sdk) => sdk?.track(event, props));
};

export const LandingAnalytics = () => {
  const pathname = usePathname();

  useEffect(() => {
    const where = landingPageOf(pathname);
    if (!where) return;
    const startedAt = Date.now();

    // 첫 화면 그림을 다 받은 뒤 쉬는 틈에 SDK를 받는다 — 첫 화면 속도를 깎지 않게
    const view = () => send(EVENTS.LANDING_VIEWED, where);
    // 사파리는 requestIdleCallback이 없어 다음 틈(setTimeout)으로 대신한다
    const whenIdle = (callback: () => void) => {
      if (typeof window.requestIdleCallback === 'function')
        window.requestIdleCallback(callback);
      else setTimeout(callback, 1);
    };
    const onLoad = () => whenIdle(view);
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (!link) return;
      const click = downloadClickOf(
        link.getAttribute('href') ?? '',
        link.closest('[data-placement]')?.getAttribute('data-placement') ??
          null,
      );
      if (click) send(EVENTS.LANDING_DOWNLOAD_CLICKED, { ...where, ...click });
    };

    // 처음 화면을 벗어날 때(탭 전환·앱 전환·닫기·랜딩 안 다른 화면으로 이동) 한 번만 머문 시간을 남긴다
    let exited = false;
    const exit = () => {
      if (exited) return;
      exited = true;
      send(EVENTS.LANDING_EXITED, {
        ...where,
        seconds: dwellSeconds(startedAt, Date.now()),
      });
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') exit();
    };

    document.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      // 랜딩 안에서 다른 화면(업데이트 기록·약관)으로 옮겨 갈 때도 앞 화면에 머문 시간을 남긴다
      exit();
      window.removeEventListener('load', onLoad);
      document.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [pathname]);

  return null;
};
