// 스토어 리다이렉트 라우트 — 인스타 프로필 등에 다는 단일 링크. UA로 기기를 판별해 맞는 스토어로 보낸다
import { EVENTS, type EventProps } from '@landit/analytics';
import { NextResponse } from 'next/server';

import { APP_STORE_URL, PLAY_STORE_URL } from '@/shared/lib/store-listing';

import { buildLinkPreviewHtml, isLinkPreviewBot } from './_lib/link-preview';

const AMPLITUDE_HTTP_API = 'https://api2.amplitude.com/2/httpapi';

type VisitProps = EventProps['Download Link Visited'];

// 서버 발화 — 클라이언트 SDK(@/shared/analytics)는 'use client'라 route 핸들러에서 못 쓴다.
// 익명 방문이라 device_id는 랜덤 UUID — 방문 횟수 집계용이고 고유 사용자 수는 아니다
const trackDownloadVisit = async (props: VisitProps) => {
  // 브라우저에도 노출되는 공개 키라 서버 발화도 같은 키를 쓴다 — 별도 env 불필요
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;

  await fetch(AMPLITUDE_HTTP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      events: [
        {
          event_type: EVENTS.DOWNLOAD_LINK_VISITED,
          device_id: crypto.randomUUID(),
          event_properties: props,
        },
      ],
    }),
    // 응답이 늦어도 리다이렉트를 1초 이상 붙잡지 않는다
    signal: AbortSignal.timeout(1000),
    // 계측 실패가 리다이렉트를 막으면 안 된다
  }).catch(() => {});
};

export async function GET(request: Request): Promise<NextResponse> {
  const userAgent = request.headers.get('user-agent') ?? '';
  const url = new URL(request.url);

  // 미리보기 봇을 스토어로 보내면 스토어 페이지 카드가 뜬다 — 랜딧 카드를 주고, 방문으로 세지 않는다
  if (isLinkPreviewBot(userAgent)) {
    return new NextResponse(buildLinkPreviewHtml(url.origin), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const isAndroid = /android/i.test(userAgent);

  // 딱지 없는(빈 값 포함) 방문은 undefined라 전송 본문에서 빠지고 store만 남는다
  const query = url.searchParams;
  await trackDownloadVisit({
    store: isAndroid ? 'play_store' : 'app_store',
    utm_source: query.get('utm_source') || undefined,
    utm_medium: query.get('utm_medium') || undefined,
    utm_campaign: query.get('utm_campaign') || undefined,
  });

  if (isAndroid) {
    return NextResponse.redirect(PLAY_STORE_URL);
  }
  return NextResponse.redirect(APP_STORE_URL);
}
