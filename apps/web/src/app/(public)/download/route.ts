// 스토어 리다이렉트 라우트 — 인스타 프로필 등에 다는 단일 링크. UA로 기기를 판별해 맞는 스토어로 보낸다
import { EVENTS, type EventProps } from '@landit/analytics';
import { NextResponse } from 'next/server';

const APP_STORE_URL = 'https://apps.apple.com/kr/app/id6787414201';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.saynow.app';

const AMPLITUDE_HTTP_API = 'https://api2.amplitude.com/2/httpapi';

type Store = EventProps['Download Link Visited']['store'];

// 서버 발화 — 클라이언트 SDK(@/shared/analytics)는 'use client'라 route 핸들러에서 못 쓴다.
// 익명 방문이라 device_id는 랜덤 UUID — 방문 횟수 집계용이고 고유 사용자 수는 아니다
const trackDownloadVisit = async (store: Store) => {
  const apiKey = process.env.AMPLITUDE_API_KEY;
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
          event_properties: { store },
        },
      ],
    }),
    // 계측 실패가 리다이렉트를 막으면 안 된다
  }).catch(() => {});
};

export async function GET(request: Request): Promise<NextResponse> {
  const userAgent = request.headers.get('user-agent') ?? '';
  const isAndroid = /android/i.test(userAgent);

  await trackDownloadVisit(isAndroid ? 'play_store' : 'app_store');

  if (isAndroid) {
    return NextResponse.redirect(PLAY_STORE_URL);
  }
  return NextResponse.redirect(APP_STORE_URL);
}
